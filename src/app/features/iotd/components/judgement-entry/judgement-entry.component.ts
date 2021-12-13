import { Component, ElementRef, OnInit } from "@angular/core";
import { State } from "@app/store/state";
import { BasePromotionEntryComponent } from "@features/iotd/components/base-promotion-entry/base-promotion-entry.component";
import { selectFutureIotdForImage } from "@features/iotd/store/iotd.selectors";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { Store } from "@ngrx/store";
import { LoadingService } from "@shared/services/loading.service";
import { Observable, of } from "rxjs";
import { distinctUntilChanged, map, take, tap } from "rxjs/operators";
import { ImageInterface } from "@shared/interfaces/image.interface";
import { CookieService } from "ngx-cookie-service";
import { DeleteIotd, PostIotd } from "@features/iotd/store/iotd.actions";
import { WindowRefService } from "@shared/services/window-ref.service";
import { ClassicRoutesService } from "@shared/services/classic-routes.service";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: "astrobin-judgement-entry",
  templateUrl: "../base-promotion-entry/base-promotion-entry.component.html",
  styleUrls: ["../base-promotion-entry/base-promotion-entry.component.scss"]
})
export class JudgementEntryComponent extends BasePromotionEntryComponent implements OnInit {
  constructor(
    public readonly store$: Store<State>,
    public readonly elementRef: ElementRef,
    public readonly loadingService: LoadingService,
    public readonly modalService: NgbModal,
    public readonly cookieService: CookieService,
    public readonly windowRefService: WindowRefService,
    public readonly classicRoutesService: ClassicRoutesService,
    public readonly translateService: TranslateService
  ) {
    super(store$, elementRef, modalService, cookieService, windowRefService, classicRoutesService, translateService);
  }

  ngOnInit() {
    super.ngOnInit();

    this.promoteButtonIcon = "trophy";
    this.promoteButtonLabel = this.translateService.instant("Make IOTD");
    this.retractPromotionButtonLabel = this.translateService.instant("Retract IOTD");
  }

  isPromoted$(imageId: ImageInterface["pk"]): Observable<boolean> {
    return this.store$.select(selectFutureIotdForImage, imageId).pipe(
      map(iotd => iotd !== null),
      distinctUntilChanged()
    );
  }

  mayPromote$(imageId: ImageInterface["pk"]): Observable<boolean> {
    // We're going to let the backend return value determine the flow.
    return of(true);
  }

  promote(imageId: ImageInterface["pk"]): void {
    this.store$.dispatch(new PostIotd({ imageId }));
  }

  retractPromotion(imageId: ImageInterface["pk"]): void {
    this.store$
      .select(selectFutureIotdForImage, imageId)
      .pipe(
        take(1),
        tap(iotd => this.store$.dispatch(new DeleteIotd({ id: iotd.id })))
      )
      .subscribe();
  }
}