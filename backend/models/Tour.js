const mongoose = require('mongoose');

const s = new mongoose.Schema(
	{
		title: { type: String, required: true },
		destination: { type: String, required: true },
		description: String,
		duration: String,
		price: { type: Number, required: true },
		// price per person (separate from package price)
		pricePerPerson: { type: Number, default: function () { return this.price; } },
		category: String,
		rating: { type: Number, default: 4.5 },
		image: String,
		places: [String],
		availableDates: [Date],
		included: [String],
		excluded: [String],
		active: { type: Boolean, default: true },
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Tour', s);
