const { randomUUID } = require('crypto');

class InMemoryUserStore {
  constructor() {
    this.users = new Map();
  }

  async createUser({ email, passwordHash, role }) {
    const id = randomUUID();
    const user = { id, email, passwordHash, role };
    this.users.set(email, user);
    return user;
  }

  async findByEmail(email) {
    return this.users.get(email) || null;
  }
}

module.exports = new InMemoryUserStore();
