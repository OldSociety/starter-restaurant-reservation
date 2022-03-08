/**
 * List handler for reservation resources
 */
const reservationService = require('./reservations.service')
const asyncErrorBoundary = require('../errors/asyncErrorBoundary')
const hasProperties = require('../errors/hasProperties')

// ensures required properities on submit
const hasRequiredProperties = hasProperties(
  'first_name',
  'last_name',
  'mobile_number',
  'reservation_date',
  'reservation_time',
  'people'
)

async function list(req, res, next) {
  const { date } = req.query
  const data = await reservationService.list(date)
  res.status(200).json({ data })
}

async function create(req, res) {
  const { data = {} } = req.body
  await reservationService.create(data)
  res.status(201).json({ data })
}

async function read(req, res, next) {
  res.json({ data: res.locals.movie });
}

const VALID_PROPERTIES = [
  'first_name',
  'last_name',
  'mobile_number',
  'reservation_date',
  'reservation_time',
  'people',
]

function hasOnlyValidProperties(req, res, next) {
  const { data = {} } = req.body

  const invalidFields = Object.keys(data).filter(
    (field) => !VALID_PROPERTIES.includes(field)
  )

  if (invalidFields.length) {
    return next({
      status: 400,
      message: `Invalid field(s): ${invalidFields.join(', ')}`,
    })
  }
  console.log(typeof data.people)
  next()
}

async function readTables(req, res, next) {
  const { id } = req.params
  const data = await reservationService.readTables(id)
  res.json({ data })
}

function dateValidation(req, res, next) {
  const { data = {} } = req.body
  let date = data.reservation_date + 'T' + data.reservation_time
  let time = data.reservation_time.replace(':', '')
  const d = new Date(date)
  const currentDate = new Date().getTime()

  //cannot set before current date
  if (d.getTime() <= currentDate) {
    return next({
      status: 400,
      message: `"future".`,
    })
    //closed on tuesdays
  } else if (
    d.getDay() === 2
    //&& !d.getTime() <= currentDate
  ) {
    return next({
      status: 400,
      message: `"closed"`,
    })
    //story is closed before 1030 am and after 930pm
  } else if (time < 1030 || time > 2130) {
    return next({
      status: 400,
      message: `"closed".`,
    })
  }
  next()
}

module.exports = {
  list: asyncErrorBoundary(list),
  read: asyncErrorBoundary(read),
  create: [
    hasOnlyValidProperties,
    hasRequiredProperties,
    dateValidation,
    asyncErrorBoundary(create),
  ],
}
