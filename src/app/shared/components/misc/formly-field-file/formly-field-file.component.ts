import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { FieldType } from "@ngx-formly/core";
import { LoadingService } from "@shared/services/loading.service";
import { UtilsService } from "@shared/services/utils/utils.service";
import { WindowRefService } from "@shared/services/window-ref.service";

@Component({
  selector: "astrobin-formly-field-file",
  templateUrl: "./formly-field-file.component.html",
  styleUrls: ["./formly-field-file.component.scss"]
})
export class FormlyFieldFileComponent extends FieldType implements OnInit {
  @ViewChild("fileInput") el: ElementRef;

  selectedFiles: { file: File; url: SafeUrl }[];

  constructor(
    public readonly sanitizer: DomSanitizer,
    public readonly loadingService: LoadingService,
    public readonly windowRefService: WindowRefService
  ) {
    super();
  }

  ngOnInit() {
    if (this.formControl.value) {
      this.loadingService.setLoading(true);
      UtilsService.fileFromUrl(this.formControl.value).then((file: File) => {
        this._setValueFromFiles([file]);
        this.loadingService.setLoading(false);
      });
    }
  }

  openFileInput() {
    this.el.nativeElement.click();
  }

  onDelete(index) {
    this.selectedFiles.splice(index, 1);
    this.formControl.patchValue(this.selectedFiles);
    this.formControl.markAsTouched();
    this.formControl.markAsDirty();
  }

  onChange(event) {
    this._setValueFromFiles(Array.from(event.target.files));
    this.formControl.markAsTouched();
    this.formControl.markAsDirty();
  }

  isImage(file: File): boolean {
    return /^image\//.test(file.type);
  }

  _setValueFromFiles(files: File[]) {
    this.selectedFiles = [];

    for (const file of files) {
      this.selectedFiles.push({
        file,
        url: this.sanitizer.bypassSecurityTrustUrl(
          (this.windowRefService.nativeWindow as any).URL.createObjectURL(file)
        )
      });
    }
  }
}
