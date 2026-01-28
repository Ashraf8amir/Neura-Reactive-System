const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const config = require('./config/config.js');
const AppError = require('./core/appError.js');
const globalErrorHandler = require('./shared/middlewares/globalErrorHandler.middleware.js');
const httpstatustext = require('./core/httpStatus.js');
const routes = require('./routes/index.js');

const app = express();

app.use(cors({
    origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
    credentials: true
}));
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use((config.nodeEnv === 'development') ? morgan('dev') : morgan('combined'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.status(200).json({
        status: httpstatustext.OK,
        message: 'Hello Vercel!'
    });
});
app.use('/api/v1', routes);
app.all('/{*splat}', (req, res, next) => {
    next(new AppError(404, httpstatustext.NOT_FOUND, `Can't find ${req.originalUrl} on this server!`));
});

app.use(globalErrorHandler);


module.exports = app;