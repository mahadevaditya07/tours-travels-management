const Tour = require('../models/Tour');

exports.getTours = async (req, res) => {
  try {
    const { search, category } = req.query;
    const q = { active: true };
    if (search) {
      q.$or = [{ title: new RegExp(search, 'i') }, { destination: new RegExp(search, 'i') }];
    }
    if (category && category !== 'All') {
      q.category = category;
    }
    const rawTours = await Tour.find(q).sort({ createdAt: -1 });
    const tours = rawTours.map(t => {
      const obj = t.toObject();
      if (!obj.id && obj._id) obj.id = String(obj._id);
      return obj;
    });
    res.json({ success: true, tours });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getTourById = async (req, res) => {
  try {
    let t = await Tour.findById(req.params.id).catch(() => null);
    if (!t) {
      t = await Tour.findOne({ id: req.params.id });
    }
    if (!t) return res.status(404).json({ success: false, message: 'Tour not found.' });
    const tour = t.toObject();
    if (!tour.id && tour._id) tour.id = String(tour._id);
    res.json({ success: true, tour });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Invalid tour ID.' });
  }
};

exports.createTour = async (req, res) => {
  try {
    const tour = await Tour.create(req.body);
    res.status(201).json({ success: true, tour });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.updateTour = async (req, res) => {
  try {
    let tour = await Tour.findById(req.params.id).catch(() => null);
    if (!tour) {
      tour = await Tour.findOne({ id: req.params.id });
    }
    if (!tour) {
      return res.status(404).json({ success: false, message: 'Tour not found.' });
    }

    if (req.body.price !== undefined) {
      tour.price = Number(req.body.price);
      if (req.body.pricePerPerson === undefined) {
        tour.pricePerPerson = Number(req.body.price);
      }
    }
    if (req.body.pricePerPerson !== undefined) {
      tour.pricePerPerson = Number(req.body.pricePerPerson);
    }

    Object.assign(tour, req.body);
    await tour.save();

    res.json({ success: true, tour });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    let tour = await Tour.findById(req.params.id).catch(() => null);
    if (!tour) {
      tour = await Tour.findOne({ id: req.params.id });
    }
    if (tour) {
      await Tour.findByIdAndDelete(tour._id);
    }
    res.json({ success: true, message: 'Tour deleted.' });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

