const { Router } = require('express');
const uploadFile = require('../middlewares/upload');
const UsersController = require('../modules/users/usersControllers');

const router = Router();

router.get('/me', UsersController.me);
router.post('/register', UsersController.register);
router.post('/confirm-register', UsersController.confirmRegister);
router.post('/login', UsersController.login);
router.post('/forget-password', UsersController.forgetPassword);
router.post('/reset-password', UsersController.resetPassword);
router.put('/:id/password', UsersController.updatePassword);
router.post('/:id/join-room/:room', UsersController.joinRoom);
router.put(
  '/:id/avatar',
  uploadFile.single('avatar'),
  UsersController.updateAvatar
);
router.get('/:id/find-rooms', UsersController.findUserRooms);

router.get('/', UsersController.findAll);
router.get('/:id', UsersController.findOne);
router.post('/', UsersController.create);
router.put('/:id', UsersController.update);
router.delete('/:id', UsersController.delete);

module.exports = router;
