const mongoose=require('mongoose');

const s=new mongoose.Schema({
	bookingId: { type: String, unique: true, default: () => `BKG-${Date.now().toString().slice(-6)}` },
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	tour: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour' },
	tourName: String,
	name: { type: String, required: true },
	email: { type: String, required: true },
	phone: { type: String, required: true },
	startLocation: { type: String, required: true },
	destination: { type: String, required: true },
	stops: [String],
	travelDate: { type: Date, required: true },
	members: { type: Number, required: true },
	vehicle: { type: String, required: true },
	distance: Number,
	basePrice: Number,
	vehicleCost: Number,
	additionalCharges: Number,
	totalPrice: { type: Number, required: true },
	status: { type: String, enum: ['Pending','Confirmed','Completed','Cancelled'], default: 'Pending' },
    // Confirmation token for verifying email/phone after booking
    confirmationToken: String,
    confirmationExpires: Date
},{ timestamps: true });

module.exports = mongoose.model('Booking', s);
