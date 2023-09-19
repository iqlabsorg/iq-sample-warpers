import { integrationTestMultipleConcurrentRentals } from './standard-warper/multiple-concurrent-rentals/multiple-concurrent-rentals-warper';
import { integrationTestMultipleNonConcurrentRentals } from './standard-warper/multiple-non-concurrent-rentals/multiple-non-concurrent-rentals-warper';

export function integrationTestStandardWarper(): void {
  integrationTestMultipleConcurrentRentals();
  integrationTestMultipleNonConcurrentRentals();
}
