const MessagesServices = require('./messagesServices');

const MessagesController = {
  async findAll(req, res) {
    const users = await MessagesServices.findAll();
    return res.json(users);
  },

  async findOne({ params }, res) {
    const user = await MessagesServices.findOne(Number(params.id));
    return res.json(user);
  },

  async create({ body }, res) {
    const user = await MessagesServices.create(body);
    return res.json(user);
  },

  async update({ body, params }, res) {
    const user = await MessagesServices.update(Number(params.id), body);
    return res.json(user);
  },

  async delete({ params }, res) {
    const user = await MessagesServices.delete(Number(params.id));
    return res.json(user);
  },
};

module.exports = MessagesController;
