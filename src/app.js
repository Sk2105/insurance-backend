const express = require("express");
const customerRoutes = require("./routes/customerRoutes");
const policyRoutes = require("./routes/policyRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const AppError = require("./utils/AppError");

const app = express();
app.use(express.json());

app.get("/health", (req, res) => res.json({ success: true, status: "ok" }));

app.use("/customers", customerRoutes);
app.use("/policies", policyRoutes);
app.use("/payments", paymentRoutes);

app.use((req, res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
});

const MYSQL_ERROR_STATUS = {
  ER_DUP_ENTRY: 409,
  ER_NO_REFERENCED_ROW_2: 422,
  ER_NO_REFERENCED_ROW: 422,
  ER_ROW_IS_REFERENCED_2: 422,
};

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || MYSQL_ERROR_STATUS[err.code] || 500;
  if (statusCode >= 500) {
    console.error(err);
  }
  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || "Internal server error",
      code: err.code || undefined,
    },
  });
});

module.exports = app;
