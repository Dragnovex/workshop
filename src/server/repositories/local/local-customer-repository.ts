import { customers } from "@/modules/customers/data";
import type { CustomerRepository } from "../customer-repository";

/** محوّل محلي (in-memory) — للتطوير والعرض فقط، بلا اتصال بقاعدة بيانات حقيقية. */
export class LocalCustomerRepository implements CustomerRepository {
  async findAll() {
    return customers;
  }

  async findById(id: string) {
    return customers.find((customer) => customer.id === id) ?? null;
  }
}

export const customerRepository: CustomerRepository = new LocalCustomerRepository();
