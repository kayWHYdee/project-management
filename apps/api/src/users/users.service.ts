import { Injectable } from '@nestjs/common';
import { Prisma, type User as PrismaUser } from '@prisma/client';
import type { CreateUserRequest, UpdateUserRequest, User } from '@water-pm/shared';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { ConflictError, NotFoundError } from '../common/errors/domain-error';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { PasswordService } from '../auth/password.service';
import { SessionService } from '../auth/session.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionService,
    private readonly audit: AuditService,
  ) {}

  async list(): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
    return users.map((user) => this.toUser(user));
  }

  async create(dto: CreateUserRequest, actor: AuthenticatedUser): Promise<User> {
    const passwordHash = await this.passwords.hash(dto.password);
    try {
      const created = await this.prisma.user.create({
        data: { name: dto.name, email: dto.email, passwordHash, role: dto.role },
      });
      await this.audit.record({
        userId: actor.id,
        entity: 'User',
        entityId: created.id,
        action: 'CREATE',
        after: this.safe(created),
      });
      return this.toUser(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError('A user with this email already exists', {
          email: ['A user with this email already exists'],
        });
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateUserRequest, actor: AuthenticatedUser): Promise<User> {
    const before = await this.prisma.user.findUnique({ where: { id } });
    if (!before) {
      throw new NotFoundError('User not found');
    }

    await this.assertNotLockingOutLastOwner(before, dto);

    const updated = await this.prisma.user.update({ where: { id }, data: { ...dto } });
    await this.audit.record({
      userId: actor.id,
      entity: 'User',
      entityId: id,
      action: 'UPDATE',
      before: this.safe(before),
      after: this.safe(updated),
    });

    // Deactivation or a role change must take effect immediately.
    const deactivated = dto.isActive === false;
    const roleChanged = dto.role !== undefined && dto.role !== before.role;
    if (deactivated || roleChanged) {
      await this.sessions.revokeAllForUser(id);
    }

    return this.toUser(updated);
  }

  /** Guards against removing the last active OWNER, which would lock everyone out of user management. */
  private async assertNotLockingOutLastOwner(
    before: PrismaUser,
    dto: UpdateUserRequest,
  ): Promise<void> {
    const wasActiveOwner = before.role === 'OWNER' && before.isActive;
    if (!wasActiveOwner) {
      return;
    }
    const willBeOwner = (dto.role ?? before.role) === 'OWNER';
    const willBeActive = dto.isActive ?? before.isActive;
    if (willBeOwner && willBeActive) {
      return;
    }
    const otherActiveOwners = await this.prisma.user.count({
      where: { role: 'OWNER', isActive: true, id: { not: before.id } },
    });
    if (otherActiveOwners === 0) {
      throw new ConflictError('At least one active owner must remain');
    }
  }

  private toUser(user: PrismaUser): User {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    };
  }

  /** User view for audit logs — never includes the password hash. */
  private safe(user: PrismaUser): Record<string, unknown> {
    const { passwordHash: _passwordHash, ...rest } = user;
    return rest;
  }
}
