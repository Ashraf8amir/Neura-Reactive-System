const mongoose = require('mongoose');

const connectDB = (url) => {
    return mongoose.connect(url)
        .catch((error) => {
            console.error('Error connecting to MongoDB:', error);
            process.exit(1);
        })
};

module.exports = connectDB;