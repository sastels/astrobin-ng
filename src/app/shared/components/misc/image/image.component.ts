import {
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from "@angular/core";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { LoadImage, LoadImageRevisions } from "@app/store/actions/image.actions";
import { LoadThumbnail } from "@app/store/actions/thumbnail.actions";
import { selectImage } from "@app/store/selectors/app/image.selectors";
import { selectThumbnail } from "@app/store/selectors/app/thumbnail.selectors";
import { State } from "@app/store/state";
import { Store } from "@ngrx/store";
import { BaseComponentDirective } from "@shared/components/base-component.directive";
import { ImageAlias } from "@shared/enums/image-alias.enum";
import { ImageInterface, ImageRevisionInterface } from "@shared/interfaces/image.interface";
import { ImageApiService } from "@shared/services/api/classic/images/image/image-api.service";
import { ImageService } from "@shared/services/image/image.service";
import { UtilsService } from "@shared/services/utils/utils.service";
import { WindowRefService } from "@shared/services/window-ref.service";
import { debounceTime, distinctUntilChanged, filter, map, switchMap, take, takeUntil } from "rxjs/operators";
import { fromEvent, Observable, of } from "rxjs";
import { selectImageRevisionsForImage } from "@app/store/selectors/app/image-revision.selectors";
import { Actions } from "@ngrx/effects";
import { ImageThumbnailInterface } from "@shared/interfaces/image-thumbnail.interface";

@Component({
  selector: "astrobin-image",
  templateUrl: "./image.component.html",
  styleUrls: ["./image.component.scss"]
})
export class ImageComponent extends BaseComponentDirective implements OnInit, OnChanges {
  @Input()
  @HostBinding("attr.data-id")
  id: number;

  @Input()
  revision = "final";

  @Input()
  alias: ImageAlias;

  @Input()
  autoHeight = true;

  @Input()
  autoLoadRevisions = true;

  @Output()
  loaded = new EventEmitter();

  @HostBinding("class.loading")
  loading = false;

  image: ImageInterface;
  thumbnailUrl: SafeUrl;
  width: number;
  height: number;
  progress = 0;

  constructor(
    public readonly store$: Store<State>,
    public readonly actions$: Actions,
    public readonly imageApiService: ImageApiService,
    public readonly imageService: ImageService,
    public readonly elementRef: ElementRef,
    public readonly utilsService: UtilsService,
    public readonly windowRefService: WindowRefService,
    public readonly domSanitizer: DomSanitizer
  ) {
    super(store$);
  }

  ngOnInit() {
    super.ngOnInit();

    if (this.id === null) {
      throw new Error("Attribute 'id' is required");
    }

    if (this.alias === null) {
      throw new Error("Attribute 'alias' is required");
    }

    fromEvent(this.windowRefService.nativeWindow, "scroll")
      .pipe(takeUntil(this.destroyed$), debounceTime(50), distinctUntilChanged())
      .subscribe(() => this.load());
  }

  ngOnChanges(changes: SimpleChanges) {
    this.load();
  }

  load() {
    // 0-200 ms
    this.utilsService
      .delay(Math.floor(Math.random() * 200))
      .pipe(take(1))
      .subscribe(() => {
        if (!!this.thumbnailUrl) {
          return;
        }

        if (this.loading) {
          return;
        }

        if (!this.utilsService.isNearBelowViewport(this.elementRef.nativeElement)) {
          return;
        }

        this.loading = true;

        this.store$
          .select(selectImage, this.id)
          .pipe(
            filter(image => !!image),
            take(1),
            switchMap(image =>
              this.store$.select(selectImageRevisionsForImage, this.id).pipe(
                take(1),
                map(() => image)
              )
            ),
            switchMap(image => this._loadRevision(image).pipe(map(revision => ({ image, revision }))))
          )
          .subscribe(({ image, revision }) => {
            this.image = image;
            const w = !!revision ? revision.w : image.w;
            const h = !!revision ? revision.h : image.h;
            this._setWidthAndHeight(w, h);
            this._loadThumbnail();
          });

        this.store$.dispatch(new LoadImage(this.id));

        if (this.autoLoadRevisions) {
          this.store$.dispatch(new LoadImageRevisions({ imageId: this.id }));
        }
      });
  }

  onLoad(event) {
    this.loaded.emit();
  }

  private _loadRevision(image: ImageInterface): Observable<ImageRevisionInterface> {
    if (this.revision === "0") {
      return of(null);
    }

    return this.store$.select(selectImageRevisionsForImage, image.pk).pipe(
      take(1),
      map(imageRevisions => {
        const matchingRevisions = imageRevisions.filter(
          imageRevision => (imageRevision.isFinal && this.revision === "final") || imageRevision.label === this.revision
        );

        if (matchingRevisions.length > 0) {
          return imageRevisions[0];
        }

        return null;
      })
    );
  }

  private _loadThumbnail() {
    const preRenderedThumbnails: ImageThumbnailInterface[] = this.image.thumbnails
      ? this.image.thumbnails.filter(thumbnail => thumbnail.alias === this.alias)
      : [];

    if (preRenderedThumbnails.length > 0) {
      this.imageService
        .loadImageFile(preRenderedThumbnails[0].url, (progress: number) => {
          this.progress = progress;
        })
        .subscribe(url => {
          this.thumbnailUrl = preRenderedThumbnails[0].url;
          this.loading = false;
        });
      return;
    }

    this.store$
      .select(selectThumbnail, {
        id: this.id,
        revision: this.revision,
        alias: this.alias
      })
      .pipe(
        filter(thumbnail => !!thumbnail),
        take(1),
        switchMap(thumbnail =>
          this.imageService.loadImageFile(thumbnail.url, (progress: number) => {
            this.progress = progress;
          })
        ),
        map(url => this.domSanitizer.bypassSecurityTrustUrl(url))
      )
      .subscribe(url => {
        this.thumbnailUrl = url;
        this.loading = false;
      });

    this.store$.dispatch(
      new LoadThumbnail({ data: { id: this.id, revision: this.revision, alias: this.alias }, bustCache: false })
    );
  }

  private _setWidthAndHeight(imageWidth: number, imageHeight: number) {
    const containerWidth = this.elementRef.nativeElement.offsetWidth;

    if (this.autoHeight) {
      this.width = containerWidth;
      this.height = (imageHeight / imageWidth) * containerWidth;
    } else {
      this.width = containerWidth;
      this.height = undefined;
    }
  }
}
