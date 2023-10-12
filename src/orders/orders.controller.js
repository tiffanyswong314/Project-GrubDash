const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

////////// VALIDATION HANDLERS //////////

// deliverTo/mobileNumber prop is missing or empty
function bodyIncludesData(propName) {
    return function(req, res, next) {
        const { data = {} } = req.body;
        if (data[propName] && data[propName] !== "") {
            return next();
        } next({
            status: 400,
            message: `Order must include a ${propName}`
        });
    };
};

// dishes prop is missing, empty, or not an array, 
function validDish(req, res, next) {
    const { data: { dishes } = {} } = req.body;
    if (dishes.length !== 0 && Array.isArray(dishes)) {
        return next();
    } else {
        return next({
            status: 400,
            message: `Order must include at least one dish`,
        });
    };
};

// quantity prop is missing, <1, or not an integer
function validQty(req, res, next) {
    const { data: { dishes } = {} } = req.body;
    dishes.forEach((dish, index) => {
        const quantity = dish.quantity;
        if (!quantity || quantity < 1 || Number(quantity) !== quantity) {
            next({
                status: 400,
                message: `Dish ${index} must have a quantity that is an integer greater than 0`,
            });
        };
    });
    next();
};

// :orderId does not exist	
function orderExists(req, res, next) {
    const orderId = req.params.orderId;
    const foundOrder = orders.find((order) => order.id === orderId);
    if (foundOrder) {
        res.locals.order = foundOrder;
        return next();
    } else {
        return next({
            status: 404,
            message: `Order does not exist: ${req.params.orderId}`,
        });
    };
};

// id of body does not match :orderId from the route
function orderMatch(req, res, next) {
    const orderId = req.params.orderId;
    const { data: { id } = {} } = req.body;
    if (id) {
        if (id === orderId) {
            return next();
        } else {
            return next({
                status: 400,
                message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
            });
        };
    } else {
        next();
    };
};

// validate status property before update()
function verifyUpdate(req, res, next) {
    const { data: { status } = {} } = req.body;
    if (!status || ( status !== "pending" && status !== "preparing" && status !== "out-for-delivery") ) {
        return next({
            status: 400,
            message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
        });
    } else if (status === "delivered") {
        return next({
            status: 400,
            message: `A delivered order cannot be changed`,
        });
    };
    next();
};

// validate status property before delete()
function verifyDelete(req, res, next) {
    const order = res.locals.order;
    if (order.status === "pending") {
        return next();
    } else {
        return next({
            status: 400,
            message: `An order cannot be deleted unless it is pending`,
        });
    };
};

////////// HTTP FUNCTIONS //////////

// create()
function create(req, res) {
    const { data: { deliverTo, mobileNumber, dishes, status } = {} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        dishes,
        status,
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
};

// read()
function read(req, res) {
    res.json({ data: res.locals.order });
};

// update()
function update(req, res) {
    const foundOrder = res.locals.order;
    const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
    foundOrder.deliverTo = deliverTo;
    foundOrder.mobileNumber = mobileNumber;
    foundOrder.dishes = dishes;
    res.json({ data: foundOrder });
};

// delete()
function destroy(req, res) {
    const order = res.locals.order;
    const index = orders.findIndex((orderNum) => orderNum.id === Number(order.id));
    orders.splice(index, 1);
    res.sendStatus(204);
};

// list()
function list(req, res) {
    res.json({ data: orders });
};

module.exports = {
    create: [
        bodyIncludesData("deliverTo"),
        bodyIncludesData("mobileNumber"),
        bodyIncludesData("dishes"),
        validDish,
        validQty,
        create,
    ],
    read: [
        orderExists,
        read
    ],
    update: [
        bodyIncludesData("deliverTo"),
        bodyIncludesData("mobileNumber"),
        bodyIncludesData("dishes"),
        bodyIncludesData("status"),orderExists,
        validDish,
        validQty,
        orderMatch,
        verifyUpdate,
        update,
    ],
    delete: [
        orderExists,
        verifyDelete,
        destroy],
    list,
  };