import { Injectable } from "@angular/core";
import { PayableProductInterface } from "@features/subscriptions/interfaces/payable-product.interface";
import { PaymentsApiService } from "@features/subscriptions/services/payments-api.service";
import { TranslateService } from "@ngx-translate/core";
import { JsonApiService } from "@shared/services/api/classic/json/json-api.service";
import { SubscriptionName } from "@shared/types/subscription-name.type";
import * as countryJs from "country-js";
import { Observable } from "rxjs";
import { take } from "rxjs/operators";

@Injectable({
  providedIn: "root"
})
export class SubscriptionsService {
  currency: string;

  constructor(
    public readonly translate: TranslateService,
    public readonly jsonApiService: JsonApiService,
    public readonly paymentsApiService: PaymentsApiService
  ) {
    this.jsonApiService
      .getBackendConfig$()
      .pipe(take(1))
      .subscribe(config => {
        const country = config.REQUEST_COUNTRY;
        const results = countryJs.search(country);
        const defaultCurrency = "USD";

        if (results.length === 0) {
          this.currency = defaultCurrency;
        } else {
          this.currency = results[0].currency.currencyCode;
        }

        if (["USD", "EUR", "GBP", "CAD", "AUD", "CHF"].indexOf(this.currency) === -1) {
          this.currency = defaultCurrency;
        }
      });
  }

  getName(product: PayableProductInterface): string {
    const resultMap = {
      [PayableProductInterface.LITE]: "Lite",
      [PayableProductInterface.PREMIUM]: "Premium",
      [PayableProductInterface.ULTIMATE]: "Ultimate"
    };

    return resultMap[product];
  }

  getPrice(product: PayableProductInterface): Observable<number> {
    if (!this.currency) {
      return new Observable<number>(observer => {
        setTimeout(() => {
          this.getPrice(product).subscribe(price => {
            observer.next(price);
            observer.complete();
          });
        }, 100);
      });
    }

    const observables = {
      [PayableProductInterface.LITE]: this.paymentsApiService.getPrice("lite", this.currency),
      [PayableProductInterface.PREMIUM]: this.paymentsApiService.getPrice("premium", this.currency),
      [PayableProductInterface.ULTIMATE]: this.paymentsApiService.getPrice("ultimate", this.currency)
    };

    return observables[product];
  }

  getSameTierOrAbove(product: PayableProductInterface): SubscriptionName[] {
    const resultMap = {
      [PayableProductInterface.LITE]: [
        SubscriptionName.ASTROBIN_LITE,
        SubscriptionName.ASTROBIN_LITE_AUTORENEW,
        SubscriptionName.ASTROBIN_LITE_2020,
        SubscriptionName.ASTROBIN_PREMIUM,
        SubscriptionName.ASTROBIN_PREMIUM_AUTORENEW,
        SubscriptionName.ASTROBIN_PREMIUM_2020,
        SubscriptionName.ASTROBIN_ULTIMATE_2020
      ],
      [PayableProductInterface.PREMIUM]: [
        SubscriptionName.ASTROBIN_PREMIUM,
        SubscriptionName.ASTROBIN_PREMIUM_AUTORENEW,
        SubscriptionName.ASTROBIN_PREMIUM_2020,
        SubscriptionName.ASTROBIN_ULTIMATE_2020
      ],
      [PayableProductInterface.ULTIMATE]: [SubscriptionName.ASTROBIN_ULTIMATE_2020]
    };

    return resultMap[product];
  }

  getConversionId(product: PayableProductInterface): string {
    const resultMap = {
      [PayableProductInterface.LITE]: "LddRCIuvv-EBEJS5qawC",
      [PayableProductInterface.PREMIUM]: "-0o-CKetv-EBEJS5qawC",
      [PayableProductInterface.ULTIMATE]: "pDXJCMvpo-EBEJS5qawC"
    };

    return resultMap[product];
  }

  maxUploadsMessage(max: number): string {
    return this.translate.instant("Max. {{ max }} uploads", { max });
  }

  maxImagesMessage(max: number): string {
    return this.translate.instant("Max. {{ max }} total images", { max });
  }

  maxSizeMessage(max: number): string {
    return this.translate.instant("Max. {{ max }} MB / image", { max });
  }

  maxRevisionsMessage(max: number): string {
    return this.translate.instant("{{ max }} revisions / image", { max });
  }
}
