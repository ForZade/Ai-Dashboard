import { prismaService } from "../db";

export class PositionService {
  async getNewRootPosition(userId: bigint): Promise<number> {
    const prisma = prismaService.getClient();

    const projects = await prisma.project.findFirst({
        where: { user_id: userId },
        orderBy: { position: 'desc' },
        select: { position: true },
    })

    const maxPos = Math.max(projects?.position ?? -1);

    return maxPos + 1;
  }
}
