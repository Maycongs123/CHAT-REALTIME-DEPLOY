const {
  UserStatus,
  ConfirmCodeStatus,
  ResetPasswordTokenStatus,
} = require('@prisma/client');
const MailMessage = require('nodemailer/lib/mailer/mail-message');
const createCode = require('../../utils/createCode');
const prisma = require('../../utils/database');
const MailService = require('../../utils/mail');
const AuthService = require('../../utils/auth');
const path = require('path');

const UsersServices = {
  async findAll() {
    const users = await prisma.user.findMany();
    return users;
  },

  async findOne(id) {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return user;
  },

  async create(data) {
    const existsUser = await prisma.user.findFirst({
      where: { email: data.email },
    });

    if (existsUser && existsUser.status === UserStatus.ACTIVE)
      throw new Error('Já existe um usuário com este e-mail');

    const user =
      existsUser ||
      (await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: data.password,
        },
      }));
    return user;
  },

  async update(id, data) {
    const user = await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
      },
    });
    return user;
  },

  async delete(id) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    await prisma.user.delete({
      where: { id },
    });

    return res.json(user);
  },

  async findByEmail(email) {
    return await prisma.user.findFirst({
      where: { email },
    });
  },

  async findByToken(token) {
    const payload = AuthService.verifyToken(token);
    if (!payload || !payload.id) return null;
    const user = await UsersServices.findOne(payload.id);

    return user;
  },

  async findUserRoom(id, roomCode) {
    const userRoom = await prisma.userRoom.findFirst({
      where: { userId: id, room: { code: roomCode } },
      include: { room: true },
    });

    return userRoom?.room;
  },

  async findUserRooms(id, filter) {
    const filterObj = {};

    if (filter) {
      filterObj.OR = [
        { name: { contains: filter } },
        { code: { contains: filter } },
      ];
    }

    const rooms = await prisma.room.findMany({
      where: { users: { some: { userId: id } }, ...filterObj },
    });

    return rooms;
  },

  async login(data) {
    const user = await UsersServices.findByEmail(data.email);

    if (!user) throw new Error('E-mail não encontrado!');
    if (user.password !== data.password) throw new Error('Senha incorreta!');
    if (user.status !== UserStatus.ACTIVE) throw new Error('Usuário inválido!');

    const token = AuthService.createToken({ id: user.id });
    return { user, token };
  },

  async register(data) {
    const user = await UsersServices.create(data);

    await prisma.confirmCode.updateMany({
      where: { userId: user.id },
      data: { status: ConfirmCodeStatus.EXPIRED },
    });

    const code = createCode().withLetters().withNumbers().create(6);
    console.log(code);

    await prisma.confirmCode.create({
      data: { code, userId: user.id },
    });

    return { user, code };
  },

  async confirmRegister(email, code) {
    const codes = await prisma.confirmCode.findMany();

    const user = await UsersServices.findByEmail(email);
    if (!user) throw new Error('Usuário não encontrado!');

    const confirmCode = await prisma.confirmCode.findFirst({
      where: {
        userId: user.id,
        code,
      },
    });

    if (!confirmCode) throw new Error('Código não encontrado!');

    if (confirmCode.status !== ConfirmCodeStatus.PENDING) {
      throw new Error('Código expirado!!!');
    }

    await prisma.confirmCode.update({
      where: {
        id: confirmCode.id,
      },
      data: { status: ConfirmCodeStatus.USED },
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { status: UserStatus.ACTIVE },
    });

    const token = AuthService.createToken({ id: user.id });

    return { user, token };
  },

  async sendConfirmEmailRegister(data) {
    const html = MailService.template('register', {
      name: data.name,
      code: data.code,
      link: data.link,
    });
    MailService.sendMail(data.email, 'Confirmação do registo!', html);
  },

  async sendResetPasswordEmail(data) {
    const html = MailService.template('forget-password', {
      name: data.name,
      link: `${data.origin}/password/reset?token=${data.token}`,
    });

    await MailService.sendMail(data.email, `Reset da senha ${data.name}`, html);
  },

  async forgetPassword(email) {
    const user = await UsersServices.findByEmail(email);

    if (!user) throw new Error('Usuário não encontrado!');
    if (user.status === UserStatus.PENDING) throw new Error('Usuário inválido');

    const token = createCode()
      .withLetters()
      .withNumbers()
      .withUpperLetters()
      .create(24);

    await prisma.resetPasswordToken.updateMany({
      where: { userId: user.id },
      data: { status: ResetPasswordTokenStatus.EXPIRED },
    });
    await prisma.resetPasswordToken.create({
      data: { userId: user.id, token },
    });

    return { user, token };
  },

  async resetPassword(data) {
    const token = await prisma.resetPasswordToken.findFirst({
      where: { token: data.token, status: ResetPasswordTokenStatus.PENDING },
      include: { user: true },
    });

    if (!token) throw new Error('Token inválido');
    if (data.password === token.user.password)
      throw new Error('Nova senha não pode ser igual a anterior!');

    await prisma.resetPasswordToken.update({
      where: { id: token.id },
      data: { status: ResetPasswordTokenStatus.USED },
    });

    await prisma.user.update({
      where: { id: token.user.id },
      data: { password: data.password },
    });

    return token.user;
  },

  async updatePassword(id, { oldPassword, newPassword }) {
    const user = await UsersServices.findOne(id);
    if (!user) throw new Error('Usuário não encontrado!');

    if (user.password !== oldPassword)
      throw new Error('Senha antiga incorreta!');
    if (user.password === newPassword)
      throw new Error('Nova senha não pode ser igual a antiga!');

    await prisma.user.update({
      where: { id },
      data: { password: newPassword },
    });

    return user;
  },

  async joinRoom(id, roomCode) {
    const usersRooms = await prisma.userRoom.findMany();
    const rooms = await prisma.room.findMany();

    const room = await prisma.room.findFirst({ where: { code: roomCode } });
    if (!room) throw new Error('Sala não encontrada');

    const joinedRoom = await prisma.userRoom.create({
      data: { userId: id, roomId: room.id },
    });

    return joinedRoom;
  },

  async updateAvatar(id, image) {
    if (image === undefined)
      throw new Error('Você precisa selecionar um arquivo.');

    await prisma.user.update({
      where: { id },
      data: {
        imageURL: `http://localhost:4000/${image.path}`,
      },
    });

    return image.path;
  },
};

module.exports = UsersServices;
