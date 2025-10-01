// middlewares/validate.js
const validate =
  (schema, source = 'body') =>
  (req, res, next) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Payload inválido', details: parsed.error.issues });
    }
    req.validated = parsed.data;
    next();
  };

module.exports = { validate };