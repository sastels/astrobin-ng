import { Inject, Injectable, PLATFORM_ID } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { BaseService } from "@shared/services/base.service";
import { LoadingService } from "@shared/services/loading.service";
import { ActiveToast, IndividualConfig, ToastrService } from "ngx-toastr";
import { isPlatformServer } from "@angular/common";

export interface ToastButtonInterface {
  id: string;
  title: string;
  classList: string;
}

export interface ExtendedIndividualConfig extends IndividualConfig {
  buttons: ToastButtonInterface[];
}

@Injectable({
  providedIn: "root"
})
export class PopNotificationsService extends BaseService {
  public constructor(
    public loadingService: LoadingService,
    public toastr: ToastrService,
    public translate: TranslateService,
    @Inject(PLATFORM_ID) public readonly platformId: Object
  ) {
    super(loadingService);
  }

  public success(message: string, title?: string, options?: Partial<ExtendedIndividualConfig>): ActiveToast<any> {
    if (isPlatformServer(this.platformId)) {
      return;
    }
    return this.toastr.success(message, title ? title : this.translate.instant("Success!"), options);
  }

  public info(message: string, title?: string, options?: Partial<ExtendedIndividualConfig>): ActiveToast<any> {
    if (isPlatformServer(this.platformId)) {
      return;
    }
    return this.toastr.info(message, title ? title : this.translate.instant("Info"), options);
  }

  public warning(message: string, title?: string, options?: Partial<ExtendedIndividualConfig>): ActiveToast<any> {
    if (isPlatformServer(this.platformId)) {
      return;
    }
    return this.toastr.warning(message, title ? title : this.translate.instant("Warning!"), options);
  }

  public error(message: string, title?: string, options?: Partial<ExtendedIndividualConfig>): ActiveToast<any> {
    if (isPlatformServer(this.platformId)) {
      return;
    }
    return this.toastr.error(message, title ? title : this.translate.instant("Error!"), options);
  }

  public remove(toastId?: number) {
    this.toastr.remove(toastId);
  }

  public clear(toastId?: number) {
    this.toastr.clear(toastId);
  }
}
