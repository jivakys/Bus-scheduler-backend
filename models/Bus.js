const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
    busNumber: {
        type: String,
        required: true,
        unique: true
    },
    busName: {
        type: String,
        required: true
    },
    capacity: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['AC', 'Non-AC'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'maintenance', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Bus', busSchema); 