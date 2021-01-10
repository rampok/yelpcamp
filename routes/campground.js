const express = require('express');
const router = express.Router();

const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');
const { campgroundSchema, reviewSchema } = require('../schemas.js');
const isLoggedIn = require('../middleware');

const Campground = require('../models/campground');


const validateCampground = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body);
    if (error){
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400)
    } else {
        next();
    };
};



router.get('/', catchAsync( async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds, title: 'Campgrounds Index' });
}));

router.get('/new', isLoggedIn, (req, res) => {
    res.render('campgrounds/new', { title: 'New Campground' });
});

router.post('/', isLoggedIn, validateCampground, catchAsync( async (req, res, next) => {
    const campground = new Campground(req.body.campground);
    await campground.save();
    req.flash('success', 'Succesfully made a new Campground!');
    res.redirect(`/campgrounds/${ campground._id}`);
}));

router.get('/:id', catchAsync( async (req, res) => {
    const campground = await Campground.findById(req.params.id).populate('reviews');
        if (!campground) {
            req.flash('error', 'Campground not found');
            return res.redirect('/campgrounds');
        };
    res.render('campgrounds/show', { campground, title: campground.title });
}));

router.get('/:id/edit', isLoggedIn, catchAsync( async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    res.render('campgrounds/edit', { campground, title: 'Edit Campground' });
}));

router.put('/:id', isLoggedIn, validateCampground, catchAsync( async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, {...req.body.campground});
    if (!campground) {
        req.flash('error', 'Campground not found');
        return res.redirect('/campgrounds');
    };
    req.flash('success', 'Successfully updated Campground');
    res.redirect(`/campgrounds/${ campground._id }`);
}));

router.delete('/:id', isLoggedIn, catchAsync( async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted the Campground');
    res.redirect('/campgrounds');
}));


module.exports = router;