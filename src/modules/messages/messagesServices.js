const prisma = require('../../utils/database');

const MessagesServices = {
  async findAll(filter = {}) {
    const query = {};

    if (filter.roomId) {
      if (!query.where) query.where = {};
      query.where.roomId = filter.roomId;
    }

    const messages = await prisma.message.findMany({
      ...query,
      include: { user: { select: { id: true, name: true, imageURL: true } } },
    });
    return messages;
  },

  async findOne(id) {
    const message = await prisma.message.findUnique({
      Where: { id },
    });
    return message;
  },
  async create(data, includeUser) {
    const message = await prisma.message.create({
      data: {
        content: data.content,
        userId: data.userId,
        roomId: data.roomId,
      },
      ...(includeUser
        ? {
            include: {
              user: { select: { id: true, name: true, imageURL: true } },
            },
          }
        : {}),
    });
    return message;
  },
  async update(id, data) {
    const message = await prisma.message.update({
      where: { id },
      data: {
        content: data.content,
        userId: data.userId,
        roomId: data.roomId,
      },
    });
    return message;
  },

  async delete(id) {
    const message = await prisma.message.delete({
      where: { id },
    });
    return res.json(message);
  },
};

module.exports = MessagesServices;
