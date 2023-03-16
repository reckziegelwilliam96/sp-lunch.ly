/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this._notes = notes || '';
  }

  /** find all customers. */
  get notes() {
    return this._notes;
  }

  set notes(value) {
    this._notes = value || '';
  }

  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  static async searchByName(query) {
    const results = await db.query(
      `SELECT id,
        first_name AS "firstName",
        last_name AS  "lastName",
        phone,
        notes
      FROM customers
      WHERE lower(concat(first_name, ' ', last_name)) LIKE $1
      ORDER BY last_name, first_name`,
      [`%${query.toLowerCase()}`]
    );
    return results.rows.map(c => new Customer(c))
  }

  static async getTopCustomers() {
    const results = await db.query(
      `SELECT customers.id,
        first_name AS "firstName",
        last_name AS "lastName",
        phone,
        notes,
        COUNT(reservations.id) AS num_reservations
        FROM customers
        JOIN reservations ON customers.id = reservations.customer_id
        GROUP BY customers.id
        ORDER BY num_reservations DESC
        LIMIT 10`
    );
    return results.rows.map(c => new Customer(c));
  }
  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );  
    }
  }
  get fullName(){
    return `${this.firstName} ${this.lastName}`;
  }
}

module.exports = Customer;
