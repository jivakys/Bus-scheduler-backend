const mongoose = require('mongoose');
const Bus = require('../models/Bus');
const Route = require('../models/Route');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/bus-scheduler', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Sample bus data
const buses = [
    {
        busNumber: 'KA01AB1234',
        busName: 'Volvo AC Sleeper',
        capacity: 40,
        type: 'AC',
        status: 'active'
    },
    {
        busNumber: 'KA02CD5678',
        busName: 'Tata Non-AC Seater',
        capacity: 35,
        type: 'Non-AC',
        status: 'active'
    }
];

// Sample route data
const routes = [
    {
        routeNumber: 'R001',
        from: 'Bangalore',
        to: 'Mysore',
        distance: 150,
        estimatedTime: 180,
        departureTime: new Date('2024-05-05T08:00:00'),
        arrivalTime: new Date('2024-05-05T11:00:00'),
        price: 500,
        availableSeats: 40,
        status: 'active'
    },
    {
        routeNumber: 'R002',
        from: 'Mysore',
        to: 'Bangalore',
        distance: 150,
        estimatedTime: 180,
        departureTime: new Date('2024-05-05T14:00:00'),
        arrivalTime: new Date('2024-05-05T17:00:00'),
        price: 500,
        availableSeats: 35,
        status: 'active'
    },
    {
        routeNumber: 'R003',
        from: 'Bangalore',
        to: 'Chennai',
        distance: 350,
        estimatedTime: 420,
        departureTime: new Date('2024-05-05T10:00:00'),
        arrivalTime: new Date('2024-05-05T17:00:00'),
        price: 800,
        availableSeats: 40,
        status: 'active'
    }
];

async function seedData() {
    try {
        // Clear existing data
        await Bus.deleteMany({});
        await Route.deleteMany({});

        // Insert buses
        const insertedBuses = await Bus.insertMany(buses);
        console.log('Buses inserted:', insertedBuses.length);

        // Add bus references to routes
        const routesWithBuses = routes.map((route, index) => ({
            ...route,
            bus: insertedBuses[index % insertedBuses.length]._id
        }));

        // Insert routes
        const insertedRoutes = await Route.insertMany(routesWithBuses);
        console.log('Routes inserted:', insertedRoutes.length);

        console.log('Data seeding completed successfully');
    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        mongoose.disconnect();
    }
}

seedData(); 