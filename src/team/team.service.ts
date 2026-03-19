import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  private db(restaurantId: string) {
    return this.prisma.withTenant(restaurantId);
  }

  async create(restaurantId: string, dto: CreateTeamMemberDto) {
    // Calcul de la position auto si non fournie
    let finalPosition = dto.position;
    if (finalPosition === undefined) {
      const lastMember = await this.db(restaurantId).teamMember.findFirst({
        orderBy: { position: 'desc' },
      });
      finalPosition = lastMember ? lastMember.position + 1 : 0;
    }

    return this.db(restaurantId).teamMember.create({
      data: { ...dto, position: finalPosition, restaurant_id: restaurantId },
    });
  }

  async findAll(restaurantId: string) {
    return this.db(restaurantId).teamMember.findMany({
      orderBy: { position: 'asc' },
    });
  }

  async update(id: string, restaurantId: string, dto: UpdateTeamMemberDto) {
    try {
      return await this.db(restaurantId).teamMember.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      throw new NotFoundException('Membre de l’équipe introuvable');
    }
  }

  async remove(id: string, restaurantId: string) {
    try {
      return await this.db(restaurantId).teamMember.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(
        'Impossible de supprimer : membre introuvable',
      );
    }
  }
}
