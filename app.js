import express from "express";
import fs from "fs/promises";
import cors from "cors";

const app = express();

app.use(cors());

app.use(express.json());

app.get("/", async (req, res) => {
  res.send("Welcome");
});

app.get("/expenses", async (req, res) => {
  try {
    let { page = 1, take = 10 } = req.query;
    take > 10 ? (take = 10) : take;
    const expenses = await fs.readFile("db/expenses.json");
    const parsedExpenses = JSON.parse(expenses);

    res.status(200).json(parsedExpenses.splice((page - 1) * take, take * page));
  } catch (error) {
    console.log("Error: ", error.message);
    return res
      .status(500)
      .json({ message: "error retrieving data", data: null });
  }
});

app.get("/expenses/:id", async (req, res) => {
  try {
    const expenses = await fs.readFile("db/expenses.json");
    const parsedExpenses = JSON.parse(expenses || "[]");
    const { id } = req.params;
    const expense = parsedExpenses.find((el) => el.id === Number(id));

    if (!expense) {
      return res.status(404).json({ message: "expense not found", data: null });
    }
    res.status(200).json({ message: "success", data: expense });
  } catch (error) {
    console.log("Error get: ", error.message);
    return res.status(500).json({ message: "error retrieving data" });
  }
});
app.delete("/expenses/:id", async (req, res) => {
  try {
    const apiKey = req.headers["api-key"];
    if (!apiKey || apiKey !== "12345") {
      return res.status(403).json({ message: "Unauthorized", data: null });
    }

    const expenses = await fs.readFile("db/expenses.json", "utf-8");
    const parsedExpenses = JSON.parse(expenses || "[]");

    const { id } = req.params;

    const index = parsedExpenses.findIndex((el) => el.id === Number(id));

    if (index === -1) {
      return res.status(404).json({ message: "expense not found", data: null });
    }

    const deletedItem = parsedExpenses;
    parsedExpenses.splice(index, 1);

    await fs.writeFile(
      "db/expenses.json",
      JSON.stringify(parsedExpenses, null, 2)
    );
    res
      .status(200)
      .json({ message: "deleted successfully", data: deletedItem[index] });
  } catch (error) {
    console.log("Error: ", error.message);
    return res.status(500).json({ message: "error deleting data", data: null });
  }
});

app.post("/expenses", async (req, res) => {
  try {
    const { category, price, paymentMethod } = req.body;
    if (!category || !price || !paymentMethod) {
      return res
        .status(400)
        .json({ message: "All the fields are required", data: null });
    }
    const expenses = await fs.readFile("db/expenses.json", "utf-8");
    const parsedExpenses = JSON.parse(expenses || "[]");
    const lastId = parsedExpenses[parsedExpenses.length - 1]?.id || 0;

    const newExpense = {
      id: lastId + 1,
      category: category,
      price: price,
      paymentMethod: paymentMethod,
      date: new Date().toISOString(),
    };
    parsedExpenses.push(newExpense);

    await fs.writeFile(
      "db/expenses.json",
      JSON.stringify(parsedExpenses, null, 2)
    );

    res.status(201).json({ message: "New expense created", data: newExpense });
  } catch (error) {
    console.log("Error: ", error.message);
    return res.status(500).json({ message: "error adding data", data: null });
  }
});

app.put("/expenses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { category, price, paymentMethod } = req.body;

    const expenses = await fs.readFile("db/expenses.json", "utf-8");
    const parsedExpenses = JSON.parse(expenses || "[]");

    const index = parsedExpenses.findIndex((el) => el.id === Number(id));
    if (index === -1) {
      return res.status(404).json({ message: "expense not found", data: null });
    }

    parsedExpenses[index] = {
      ...parsedExpenses[index],
      category: category || parsedExpenses[index].category,
      price: price || parsedExpenses[index].price,
      paymentMethod: paymentMethod || parsedExpenses[index].paymentMethod,
    };

    await fs.writeFile(
      "db/expenses.json",
      JSON.stringify(parsedExpenses, null, 2)
    );

    res
      .status(200)
      .json({ message: "updated successfully", data: parsedExpenses[index] });
  } catch (error) {
    console.log("Error: ", error.message);
    return res.status(500).json({ message: "error updating data", data: null });
  }
});

app.listen(3000, () => {
  console.log("server running htpp://localhost:3000");
});
