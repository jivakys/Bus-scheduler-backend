const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
    routeNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    bus: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
        required: true
    },
    from: {
        type: String,
        required: true,
        trim: true
    },
    to: {
        type: String,
        required: true,
        trim: true
    },
    stops: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stop'
    }],
    distance: {
        type: Number,
        required: true,
        min: 0
    },
    estimatedTime: {
        type: Number, // in minutes
        required: true,
        min: 0
    },
    departureTime: {
        type: Date,
        required: true
    },
    arrivalTime: {
        type: Date,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    availableSeats: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'cancelled', 'completed', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Route', routeSchema); 