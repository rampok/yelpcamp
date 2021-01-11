const express = require('express');
const router = express.Router();

const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isAuthor, validateCampground } = require('../middleware');

const Campground = require('../models/campground');


router.get('/', catchAsync( async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds, title: 'Campgrounds Index' });
}));

router.get('/new', isLoggedIn, (req, res) => {
    res.render('campgrounds/new', { title: 'New Campground' });
});

router.post('/', isLoggedIn, validateCampground, catchAsync( async (req, res, next) => {
    const campground = new Campground(req.body.campground);
    campground.author = req.user._id;
    await campground.save();
    req.flash('success', 'Succesfully made a new Campground!');
    res.redirect(`/campgrounds/${ campground._id}`);
}));

router.get('/:id', catchAsync( async (req, res) => {
    const campground = await (await Campground.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
        }).populate('author'));
    if (!campground) {
        req.flash('error', 'Campground not found');
        return res.redirect('/campgrounds');
    };
    res.render('campgrounds/show', { campground, title: campground.title });
}));

router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync( async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    if (!campground) {
        req.flash('error', 'Campground not found');
        return res.redirect('/campgrounds');
    };
    res.render('campgrounds/edit', { campground, title: 'Edit Campground' });
}));

router.put('/:id', isAuthor, isLoggedIn, validateCampground, catchAsync( async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground) {
        req.flash('error', 'Campground not found');
        return res.redirect('/campgrounds');
    };
    const camp = await Campground.findByIdAndUpdate(id, {...req.body.campground});
    req.flash('success', 'Successfully updated Campground');
    res.redirect(`/campgrounds/${ campground._id }`);
}));

router.delete('/:id', isLoggedIn, catchAsync( async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground) {
        req.flash('error', 'Campground not found');
        return res.redirect('/campgrounds');
    };
    if (!campground.author.equals(req.user._id)) {
        req.flash('error', 'You are not authorized to do this');
        return res.redirect(`/campgrounds/${ campground._id }`);
    };
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted the Campground');
    res.redirect('/campgrounds');
}));


module.exports = router;