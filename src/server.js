const dotenv = require('dotenv');
dotenv.config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { loggerStream } = require('winston');
const router = require('./routes');
const authenticate = require('./middlewares/auth');
const createSocketServer = require('./socket');

const port =  process.env.PORT ||  8080 || 4000;
const app = express();
const server = http.createServer(app);

console.log(port);

async function main() {
	app.use(express.json());
	app.use(cors());
	app.use(morgan('tiny', { stream: loggerStream }));
	app.use('/uploads', express.static('uploads'));
	app.use(router);

	app.get('/private', authenticate(), (req, res) => {
		return res.json(req.user);
	});
	
	// createSocketServer(server);

	server.listen(port, () => {
		console.log(`Servidor rodando na porta ${port}`);
	});
}

main();
