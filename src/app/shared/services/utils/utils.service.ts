import { Injectable } from "@angular/core";
import { distinctUntilChanged } from "rxjs/operators";

@Injectable({
  providedIn: "root"
})
export class UtilsService {
  uuid(): string {
    const S4 = (): string => {
      // tslint:disable-next-line:no-bitwise
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };

    return `${S4()}${S4()}-${S4()}-${S4()}-${S4()}-${S4()}${S4()}${S4()}`;
  }

  fileExtension(filename: string): string | undefined {
    const separator = ".";

    if (!filename || filename.indexOf(separator) === -1) {
      return undefined;
    }

    return filename.split(separator).pop();
  }

  isImage(filename: string): boolean {
    if (!filename) {
      return false;
    }

    const extension = this.fileExtension(filename).toLowerCase();
    return ["png", "jpg", "jpeg", "gif"].indexOf(extension) > -1;
  }

  /**
   * Removes duplicates from an array. Items must be able to be stringified using JSON.
   * @param array
   */
  arrayUniqueObjects(array: any): any {
    const a = array.concat();
    for (let i = 0; i < a.length; ++i) {
      for (let j = i + 1; j < a.length; ++j) {
        if (JSON.stringify(a[i]) === JSON.stringify(a[j])) {
          a.splice(j--, 1);
        }
      }
    }

    return a;
  }
}

export function distinctUntilChangedObj<T>() {
  return distinctUntilChanged<T>((a, b) => JSON.stringify(a) === JSON.stringify(b));
}
