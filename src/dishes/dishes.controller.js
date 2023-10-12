const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

////////// VALIDATION HANDLERS //////////

// name/descrip/image_url prop is missing or empty
function bodyHasData(property) {
    return (req, res, next) => {
        const { data = {}} = req.body;
        if(data[property] && data[property] !== '') {
            next();
        } next({
            status: 400,
            message: `Dish must include a ${property}`
        })
    }
}
  
// price prop is missing or <1
function validPrice(req, res, next) {
    const { data: { price } = {}} = req.body;
    if(Number(price) > 0 && typeof price === "number") {
        next();
    } else {
        next({
            status: 400,
            message: `Dish must have a price that is an integer greater than 0`,
        });
    };
};

// :dishId does not exist	
function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (foundDish) {
        res.locals.dish = foundDish;
        next();
    } else {
        next({
            status: 404,
            message: `Dish ID does not exist: ${dishId}`,
        });
    };
};

// id in the body does not match :dishId in the route
function matchDish(req, res, next) {
    const { dishId } = req.params;
    const { data: {id} = {}} = req.body;
    if (id) {
        if (id !== dishId) {
            next({
                status: 400,
                message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
            });
        } next();
    } else {
        next();
    };
};

////////// HTTP FUNCTIONS //////////

// create()
function create(req, res) {
    const { data: { name, description, price, image_url } } = req.body;
    const newDish = {
        id: nextId(),
        name,
        description,
        price,
        image_url,
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
};

// read()
function read(req, res) {
    const dish = res.locals.dish;
    res.json({ data: dish });
};

// update()
function update(req, res) {
    const dish = res.locals.dish;
    const { data: { name, description, price, image_url } } = req.body;
    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;
    res.json({ data: dish });
};

// list()
function list(req, res) {
    res.json({ data: dishes });
};

module.exports = {
    create: [
        validPrice,
        bodyHasData("name"),
        bodyHasData("description"),
        bodyHasData("image_url"),
        create,
    ],
    read: [
        dishExists,
        read
    ],
    update: [
        validPrice,
        dishExists,
        matchDish,
        bodyHasData("name"),
        bodyHasData("description"),
        bodyHasData("image_url"),
        update,
    ],
    list,
};
