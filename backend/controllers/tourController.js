const Tour = require('../models/Tour');

const filterFutureDates = (datesArr) => {
  if (!Array.isArray(datesArr)) return [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return datesArr
    .map(d => new Date(d))
    .filter(d => {
      if (isNaN(d.getTime())) return false;
      const check = new Date(d);
      check.setHours(0, 0, 0, 0);
      return check.getTime() > today.getTime();
    });
};

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
      if (obj.availableDates) obj.availableDates = filterFutureDates(obj.availableDates);
      if (obj.dates) obj.dates = filterFutureDates(obj.dates);
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
    if (tour.availableDates) tour.availableDates = filterFutureDates(tour.availableDates);
    if (tour.dates) tour.dates = filterFutureDates(tour.dates);
    res.json({ success: true, tour });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Invalid tour ID.' });
  }
};

exports.createTour = async (req, res) => {
  try {
    if (req.body.availableDates || req.body.dates) {
      const filtered = filterFutureDates(req.body.availableDates || req.body.dates);
      req.body.availableDates = filtered;
      req.body.dates = filtered;
    }
    const tour = await Tour.create(req.body);
    const tourObj = tour.toObject();
    if (tourObj.availableDates) tourObj.availableDates = filterFutureDates(tourObj.availableDates);
    if (tourObj.dates) tourObj.dates = filterFutureDates(tourObj.dates);
    res.status(201).json({ success: true, tour: tourObj });
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
      req.body.price = Number(req.body.price);
      tour.price = req.body.price;
      if (req.body.pricePerPerson === undefined) {
        req.body.pricePerPerson = req.body.price;
        tour.pricePerPerson = req.body.price;
      }
    }
    if (req.body.pricePerPerson !== undefined) {
      req.body.pricePerPerson = Number(req.body.pricePerPerson);
      tour.pricePerPerson = req.body.pricePerPerson;
    }

    if (req.body.availableDates !== undefined || req.body.dates !== undefined) {
      const datesArr = req.body.availableDates || req.body.dates || [];
      const parsedDates = filterFutureDates(datesArr);
      tour.availableDates = parsedDates;
      tour.dates = parsedDates;
      req.body.availableDates = parsedDates;
      req.body.dates = parsedDates;
    }

    Object.assign(tour, req.body);
    await tour.save();

    const tourObj = tour.toObject();
    if (!tourObj.id && tourObj._id) tourObj.id = String(tourObj._id);
    if (tourObj.availableDates) tourObj.availableDates = filterFutureDates(tourObj.availableDates);
    if (tourObj.dates) tourObj.dates = filterFutureDates(tourObj.dates);

    res.json({ success: true, tour: tourObj });
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


