import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import {
  ApproveEquipmentItem,
  ApproveEquipmentItemEditProposal,
  ApproveEquipmentItemEditProposalSuccess,
  ApproveEquipmentItemSuccess,
  AssignEditProposal,
  AssignEditProposalSuccess,
  AssignItem,
  AssignItemSuccess,
  CreateAccessory,
  CreateAccessoryEditProposal,
  CreateAccessoryEditProposalSuccess,
  CreateAccessorySuccess,
  CreateBrand,
  CreateBrandSuccess,
  CreateCamera,
  CreateCameraEditProposal,
  CreateCameraEditProposalSuccess,
  CreateCameraSuccess,
  CreateEquipmentPreset,
  CreateEquipmentPresetSuccess,
  CreateFilter,
  CreateFilterEditProposal,
  CreateFilterEditProposalSuccess,
  CreateFilterSuccess,
  CreateMount,
  CreateMountEditProposal,
  CreateMountEditProposalSuccess,
  CreateMountSuccess,
  CreateSensor,
  CreateSensorEditProposal,
  CreateSensorEditProposalSuccess,
  CreateSensorSuccess,
  CreateSoftware,
  CreateSoftwareEditProposal,
  CreateSoftwareEditProposalSuccess,
  CreateSoftwareSuccess,
  CreateTelescope,
  CreateTelescopeEditProposal,
  CreateTelescopeEditProposalSuccess,
  CreateTelescopeSuccess,
  DeleteEquipmentPreset,
  DeleteEquipmentPresetSuccess,
  EquipmentActionTypes,
  FindAllBrands,
  FindAllBrandsSuccess,
  FindAllEquipmentItems,
  FindAllEquipmentItemsSuccess,
  FindCameraVariants,
  FindCameraVariantsSuccess,
  FindEquipmentItemEditProposals,
  FindEquipmentItemEditProposalsSuccess,
  FindEquipmentPresetsSuccess,
  FindRecentlyUsedEquipmentItems,
  FindRecentlyUsedEquipmentItemsSuccess,
  FindSimilarInBrand,
  FindSimilarInBrandSuccess,
  FreezeEquipmentItemAsAmbiguous,
  FreezeEquipmentItemAsAmbiguousSuccess,
  GetAllBrands,
  GetAllBrandsSuccess,
  GetAllInBrand,
  GetAllInBrandSuccess,
  GetContributorsSuccess,
  GetMostOftenUsedWith,
  GetMostOftenUsedWithSuccess,
  GetOthersInBrand,
  GetOthersInBrandSuccess,
  LoadBrand,
  LoadBrandSuccess,
  LoadEquipmentItem,
  LoadEquipmentItemSuccess,
  LoadSensor,
  LoadSensorSuccess,
  RejectEquipmentItem,
  RejectEquipmentItemEditProposal,
  RejectEquipmentItemEditProposalSuccess,
  RejectEquipmentItemSuccess,
  UnapproveEquipmentItem,
  UnapproveEquipmentItemSuccess,
  UnfreezeEquipmentItemAsAmbiguous,
  UnfreezeEquipmentItemAsAmbiguousSuccess,
  UpdateEquipmentPreset,
  UpdateEquipmentPresetSuccess
} from "@features/equipment/store/equipment.actions";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { Store } from "@ngrx/store";
import { State } from "@app/store/state";
import { All } from "@app/store/actions/app.actions";
import { EquipmentApiService } from "@features/equipment/services/equipment-api.service";
import { filter, map, mergeMap, switchMap } from "rxjs/operators";
import { selectBrand, selectEquipmentItem } from "@features/equipment/store/equipment.selectors";
import { SensorInterface } from "@features/equipment/types/sensor.interface";
import { BrandInterface } from "@features/equipment/types/brand.interface";
import { UtilsService } from "@shared/services/utils/utils.service";
import { EquipmentItemBaseInterface, EquipmentItemType } from "@features/equipment/types/equipment-item-base.interface";
import { SelectorWithProps } from "@ngrx/store/src/models";

function getFromStoreOrApiByIdAndType<T>(
  store$: Store<State>,
  id: number,
  type: EquipmentItemType,
  selector: SelectorWithProps<any, { id: number; type: EquipmentItemType }, T>,
  apiCall: (number, EquipmentItemType) => Observable<T>,
  apiContext: any
): Observable<T> {
  const fromApi: Observable<T> = apiCall.apply(apiContext, [id, type]);
  return store$
    .select(selector, { id, type })
    .pipe(switchMap(fromStore => (fromStore !== null ? of(fromStore) : fromApi)));
}

@Injectable()
export class EquipmentEffects {
  /*********************************************************************************************************************
   * Brands
   ********************************************************************************************************************/

  GetAllBrands: Observable<GetAllBrandsSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.GET_ALL_BRANDS),
      map((action: GetAllBrands) => action.payload),
      mergeMap(payload =>
        this.equipmentApiService
          .getAllBrands(payload.page, payload.sort)
          .pipe(map(response => new GetAllBrandsSuccess({ response, sort: payload.sort })))
      )
    )
  );

  LoadBrand: Observable<LoadBrandSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.LOAD_BRAND),
      map((action: LoadBrand) => action.payload.id),
      mergeMap(id => {
        if (!id) {
          return of(null);
        }

        return this.utilsService
          .getFromStoreOrApiById<BrandInterface>(
            this.store$,
            id,
            selectBrand,
            this.equipmentApiService.getBrand,
            this.equipmentApiService
          )
          .pipe(
            filter(brand => !!brand),
            map(brand => new LoadBrandSuccess({ brand }))
          );
      })
    )
  );

  CreateBrand: Observable<CreateBrandSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.CREATE_BRAND),
      map((action: CreateBrand) => action.payload.brand),
      mergeMap(brand =>
        this.equipmentApiService
          .createBrand(brand)
          .pipe(map(createdBrand => new CreateBrandSuccess({ brand: createdBrand })))
      )
    )
  );

  FindAllBrands: Observable<FindAllBrandsSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.FIND_ALL_BRANDS),
      map((action: FindAllBrands) => action.payload),
      mergeMap(payload =>
        this.equipmentApiService.findAllBrands(payload.q).pipe(map(brands => new FindAllBrandsSuccess({ brands })))
      )
    )
  );

  /*********************************************************************************************************************
   * Generic equipment items
   ********************************************************************************************************************/

  LoadEquipmentItem: Observable<LoadEquipmentItemSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.LOAD_EQUIPMENT_ITEM),
      map((action: LoadEquipmentItem) => action.payload),
      mergeMap(payload => {
        if (!!payload.item) {
          return of(new LoadEquipmentItemSuccess({ item: payload.item }));
        }

        return getFromStoreOrApiByIdAndType<EquipmentItemBaseInterface>(
          this.store$,
          payload.id,
          payload.type,
          selectEquipmentItem,
          this.equipmentApiService.getEquipmentItem,
          this.equipmentApiService
        ).pipe(map(item => new LoadEquipmentItemSuccess({ item })));
      })
    )
  );

  FindAllEquipmentItems: Observable<FindAllEquipmentItemsSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.FIND_ALL_EQUIPMENT_ITEMS),
      map((action: FindAllEquipmentItems) => action.payload),
      mergeMap(payload =>
        this.equipmentApiService
          .findAllEquipmentItems(payload.type, payload.options)
          .pipe(map(response => new FindAllEquipmentItemsSuccess({ items: response.results })))
      )
    )
  );

  FindRecentlyUsedEquipmentItems: Observable<FindRecentlyUsedEquipmentItemsSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.FIND_RECENTLY_USED_EQUIPMENT_ITEMS),
      map((action: FindRecentlyUsedEquipmentItems) => action.payload),
      mergeMap(payload =>
        this.equipmentApiService
          .findRecentlyUsedEquipmentItems(payload.type, payload.usageType)
          .pipe(
            map(
              items =>
                new FindRecentlyUsedEquipmentItemsSuccess({ type: payload.type, usageType: payload.usageType, items })
            )
          )
      )
    )
  );

  FindSimilarInBrand: Observable<FindSimilarInBrandSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.FIND_SIMILAR_IN_BRAND),
      map((action: FindSimilarInBrand) => action.payload),
      mergeMap(payload =>
        this.equipmentApiService
          .findSimilarInBrand(payload.brand, payload.q, payload.type)
          .pipe(map(items => new FindSimilarInBrandSuccess({ items })))
      )
    )
  );

  GetAllInBrand: Observable<GetAllInBrandSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.GET_ALL_IN_BRAND),
      map((action: GetAllInBrand) => action.payload),
      mergeMap(payload =>
        this.equipmentApiService
          .getAllInBrand(payload.brand, payload.type, payload.page)
          .pipe(map(response => new GetAllInBrandSuccess({ response })))
      )
    )
  );

  GetOthersInBrand: Observable<GetOthersInBrandSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.GET_OTHERS_IN_BRAND),
      map((action: GetOthersInBrand) => action.payload),
      mergeMap(payload =>
        this.equipmentApiService
          .getOthersInBrand(payload.brand, payload.type, payload.name)
          .pipe(map(items => new GetOthersInBrandSuccess({ items })))
      )
    )
  );

  ApproveEquipmentItem: Observable<ApproveEquipmentItemSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.APPROVE_EQUIPMENT_ITEM),
      map((action: ApproveEquipmentItem) => action.payload),
      mergeMap(payload =>
        this.equipmentApiService
          .approveEquipmentItem(payload.item, payload.comment)
          .pipe(map(item => new ApproveEquipmentItemSuccess({ item })))
      )
    )
  );

  UnapproveEquipmentItem: Observable<UnapproveEquipmentItemSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.UNAPPROVE_EQUIPMENT_ITEM),
      map((action: UnapproveEquipmentItem) => action.payload),
      mergeMap(payload =>
        this.equipmentApiService
          .unapproveEquipmentItem(payload.item)
          .pipe(map(item => new UnapproveEquipmentItemSuccess({ item })))
      )
    )
  );

  FreezeEquipmentItemAsAmbiguous: Observable<FreezeEquipmentItemAsAmbiguousSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.FREEZE_EQUIPMENT_ITEM_AS_AMBIGUOUS),
      map((action: FreezeEquipmentItemAsAmbiguous) => action.payload),
      mergeMap(payload =>
        this.equipmentApiService
          .freezeEquipmentItemAsAmbiguous(payload.item)
          .pipe(map(item => new FreezeEquipmentItemAsAmbiguousSuccess({ item })))
      )
    )
  );

  UnfreezeEquipmentItemAsAmbiguous: Observable<UnfreezeEquipmentItemAsAmbiguousSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.UNFREEZE_EQUIPMENT_ITEM_AS_AMBIGUOUS),
      map((action: UnfreezeEquipmentItemAsAmbiguous) => action.payload),
      mergeMap(payload =>
        this.equipmentApiService
          .unfreezeEquipmentItemAsAmbiguous(payload.item)
          .pipe(map(item => new UnfreezeEquipmentItemAsAmbiguousSuccess({ item })))
      )
    )
  );

  RejectEquipmentItem: Observable<RejectEquipmentItemSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.REJECT_EQUIPMENT_ITEM),
      map((action: RejectEquipmentItem) => action.payload),
      mergeMap(payload =>
        this.equipmentApiService
          .rejectEquipmentItem(
            payload.item,
            payload.reason,
            payload.comment,
            payload.duplicateOf,
            payload.duplicateOfKlass,
            payload.duplicateOfUsageType
          )
          .pipe(map(item => new RejectEquipmentItemSuccess({ item })))
      )
    )
  );

  FindEquipmentItemEditProposals: Observable<FindEquipmentItemEditProposalsSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.FIND_EQUIPMENT_ITEM_EDIT_PROPOSALS),
      map((action: FindEquipmentItemEditProposals) => action.payload),
      mergeMap(payload =>
        this.equipmentApiService
          .getEditProposals(payload.item)
          .pipe(map(editProposals => new FindEquipmentItemEditProposalsSuccess({ editProposals })))
      )
    )
  );

  ApproveEquipmentItemEditProposal: Observable<ApproveEquipmentItemEditProposalSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.APPROVE_EQUIPMENT_ITEM_EDIT_PROPOSAL),
      map((action: ApproveEquipmentItemEditProposal) => action.payload),
      mergeMap(payload =>
        this.equipmentApiService
          .approveEditProposal(payload.editProposal, payload.comment)
          .pipe(
            map(
              approvedEditProposal =>
                new ApproveEquipmentItemEditProposalSuccess({ editProposal: approvedEditProposal })
            )
          )
      )
    )
  );

  RejectEquipmentItemEditProposal: Observable<RejectEquipmentItemEditProposalSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.REJECT_EQUIPMENT_ITEM_EDIT_PROPOSAL),
      map((action: RejectEquipmentItemEditProposal) => action.payload),
      mergeMap(payload =>
        this.equipmentApiService
          .rejectEditProposal(payload.editProposal, payload.comment)
          .pipe(
            map(
              rejectedEditProposal => new RejectEquipmentItemEditProposalSuccess({ editProposal: rejectedEditProposal })
            )
          )
      )
    )
  );

  GetMostOftenUsedWith: Observable<GetMostOftenUsedWithSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.GET_MOST_OFTEN_USED_WITH),
      map((action: GetMostOftenUsedWith) => action.payload),
      mergeMap(payload =>
        this.equipmentApiService
          .getMostOftenUsedWith(payload.itemType, payload.itemId)
          .pipe(
            map(data => new GetMostOftenUsedWithSuccess({ itemType: payload.itemType, itemId: payload.itemId, data }))
          )
      )
    )
  );

  GetContributors: Observable<GetContributorsSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.GET_CONTRIBUTORS),
      mergeMap(() =>
        this.equipmentApiService
          .getContributors()
          .pipe(map(contributors => new GetContributorsSuccess({ contributors })))
      )
    )
  );

  AssignItem: Observable<AssignItemSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.ASSIGN_ITEM),
      map((action: AssignItem) => action.payload),
      mergeMap(payload =>
        this.equipmentApiService
          .assignItem(payload.itemType, payload.itemId, payload.assignee)
          .pipe(map(item => new AssignItemSuccess({ item })))
      )
    )
  );

  AssignEditProposal: Observable<AssignEditProposalSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.ASSIGN_EDIT_PROPOSAL),
      map((action: AssignEditProposal) => action.payload),
      mergeMap(payload =>
        this.equipmentApiService
          .assignEditProposal(payload.itemType, payload.editProposalId, payload.assignee)
          .pipe(map(editProposal => new AssignEditProposalSuccess({ editProposal })))
      )
    )
  );

  /*********************************************************************************************************************
   * Equipment presets
   ********************************************************************************************************************/

  FindEquipmentPresets: Observable<FindEquipmentPresetsSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.FIND_EQUIPMENT_PRESETS),
      mergeMap(() =>
        this.equipmentApiService
          .findEquipmentPresets()
          .pipe(map(presets => new FindEquipmentPresetsSuccess({ presets })))
      )
    )
  );

  CreateEquipmentPreset: Observable<CreateEquipmentPresetSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.CREATE_EQUIPMENT_PRESET),
      map((action: CreateEquipmentPreset) => action.payload.preset),
      mergeMap(preset =>
        this.equipmentApiService
          .createEquipmentPreset(preset)
          .pipe(map(savedPreset => new CreateEquipmentPresetSuccess({ preset: savedPreset })))
      )
    )
  );

  UpdateEquipmentPreset: Observable<UpdateEquipmentPresetSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.UPDATE_EQUIPMENT_PRESET),
      map((action: UpdateEquipmentPreset) => action.payload.preset),
      mergeMap(preset =>
        this.equipmentApiService
          .updateEquipmentPreset(preset)
          .pipe(map(updatedPreset => new UpdateEquipmentPresetSuccess({ preset: updatedPreset })))
      )
    )
  );

  DeleteEquipmentPreset: Observable<DeleteEquipmentPresetSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.DELETE_EQUIPMENT_PRESET),
      map((action: DeleteEquipmentPreset) => action.payload.id),
      mergeMap(id =>
        this.equipmentApiService.deleteEquipmentPreset(id).pipe(map(() => new DeleteEquipmentPresetSuccess({ id })))
      )
    )
  );

  /*********************************************************************************************************************
   * Sensors
   ********************************************************************************************************************/

  LoadSensor: Observable<LoadSensorSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.LOAD_SENSOR),
      map((action: LoadSensor) => action.payload.id),
      mergeMap(id =>
        getFromStoreOrApiByIdAndType<SensorInterface>(
          this.store$,
          id,
          EquipmentItemType.SENSOR,
          selectEquipmentItem as SelectorWithProps<any, { id: number; type: EquipmentItemType }, SensorInterface>,
          this.equipmentApiService.getSensor,
          this.equipmentApiService
        ).pipe(map(sensor => new LoadSensorSuccess({ item: sensor as SensorInterface })))
      )
    )
  );

  CreateSensor: Observable<CreateSensorSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.CREATE_SENSOR),
      map((action: CreateSensor) => action.payload.sensor),
      mergeMap(sensor =>
        this.equipmentApiService
          .createSensor(sensor)
          .pipe(map(createdSensor => new CreateSensorSuccess({ item: createdSensor })))
      )
    )
  );

  CreateSensorEditProposal: Observable<CreateSensorEditProposalSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.CREATE_SENSOR_EDIT_PROPOSAL),
      map((action: CreateSensorEditProposal) => action.payload.sensor),
      mergeMap(sensor =>
        this.equipmentApiService
          .createSensorEditProposal(sensor)
          .pipe(
            map(
              createdSensorEditProposal =>
                new CreateSensorEditProposalSuccess({ editProposal: createdSensorEditProposal })
            )
          )
      )
    )
  );

  /*********************************************************************************************************************
   * Cameras
   ********************************************************************************************************************/

  CreateCamera: Observable<CreateCameraSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.CREATE_CAMERA),
      map((action: CreateCamera) => action.payload),
      mergeMap(payload =>
        this.equipmentApiService
          .createCamera(payload.camera)
          .pipe(map(createdCamera => new CreateCameraSuccess({ item: createdCamera })))
      )
    )
  );

  CreateCameraEditProposal: Observable<CreateCameraEditProposalSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.CREATE_CAMERA_EDIT_PROPOSAL),
      map((action: CreateCameraEditProposal) => action.payload.camera),
      mergeMap(camera =>
        this.equipmentApiService
          .createCameraEditProposal(camera)
          .pipe(
            map(
              createdCameraEditProposal =>
                new CreateCameraEditProposalSuccess({ editProposal: createdCameraEditProposal })
            )
          )
      )
    )
  );

  FindCameraVariants: Observable<FindCameraVariantsSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.FIND_CAMERA_VARIANTS),
      map((action: FindCameraVariants) => action.payload.id),
      mergeMap(id =>
        this.equipmentApiService
          .findCameraVariants(id)
          .pipe(map(cameraVariants => new FindCameraVariantsSuccess({ cameraVariants })))
      )
    )
  );

  /*********************************************************************************************************************
   * Telescopes
   ********************************************************************************************************************/

  CreateTelescope: Observable<CreateTelescopeSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.CREATE_TELESCOPE),
      map((action: CreateTelescope) => action.payload.telescope),
      mergeMap(telescope =>
        this.equipmentApiService
          .createTelescope(telescope)
          .pipe(map(createdTelescope => new CreateTelescopeSuccess({ item: createdTelescope })))
      )
    )
  );

  CreateTelescopeEditProposal: Observable<CreateTelescopeEditProposalSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.CREATE_TELESCOPE_EDIT_PROPOSAL),
      map((action: CreateTelescopeEditProposal) => action.payload.telescope),
      mergeMap(telescope =>
        this.equipmentApiService
          .createTelescopeEditProposal(telescope)
          .pipe(
            map(
              createdTelescopeEditProposal =>
                new CreateTelescopeEditProposalSuccess({ editProposal: createdTelescopeEditProposal })
            )
          )
      )
    )
  );

  /*********************************************************************************************************************
   * Mounts
   ********************************************************************************************************************/

  CreateMount: Observable<CreateMountSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.CREATE_MOUNT),
      map((action: CreateMount) => action.payload.mount),
      mergeMap(mount =>
        this.equipmentApiService
          .createMount(mount)
          .pipe(map(createdMount => new CreateMountSuccess({ item: createdMount })))
      )
    )
  );

  CreateMountEditProposal: Observable<CreateMountEditProposalSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.CREATE_MOUNT_EDIT_PROPOSAL),
      map((action: CreateMountEditProposal) => action.payload.mount),
      mergeMap(mount =>
        this.equipmentApiService
          .createMountEditProposal(mount)
          .pipe(
            map(
              createdMountEditProposal => new CreateMountEditProposalSuccess({ editProposal: createdMountEditProposal })
            )
          )
      )
    )
  );

  /*********************************************************************************************************************
   * Filters
   ********************************************************************************************************************/

  CreateFilter: Observable<CreateFilterSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.CREATE_FILTER),
      map((action: CreateFilter) => action.payload.filter),
      mergeMap(filter_ =>
        this.equipmentApiService
          .createFilter(filter_)
          .pipe(map(createdFilter => new CreateFilterSuccess({ item: createdFilter })))
      )
    )
  );

  CreateFilterEditProposal: Observable<CreateFilterEditProposalSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.CREATE_FILTER_EDIT_PROPOSAL),
      map((action: CreateFilterEditProposal) => action.payload.filter),
      mergeMap(filter_ =>
        this.equipmentApiService
          .createFilterEditProposal(filter_)
          .pipe(
            map(
              createdFilterEditProposal =>
                new CreateFilterEditProposalSuccess({ editProposal: createdFilterEditProposal })
            )
          )
      )
    )
  );

  /*********************************************************************************************************************
   * Accessories
   ********************************************************************************************************************/

  CreateAccessory: Observable<CreateAccessorySuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.CREATE_ACCESSORY),
      map((action: CreateAccessory) => action.payload.accessory),
      mergeMap(accessory =>
        this.equipmentApiService
          .createAccessory(accessory)
          .pipe(map(createdAccessory => new CreateAccessorySuccess({ item: createdAccessory })))
      )
    )
  );

  CreateAccessoryEditProposal: Observable<CreateAccessoryEditProposalSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.CREATE_ACCESSORY_EDIT_PROPOSAL),
      map((action: CreateAccessoryEditProposal) => action.payload.accessory),
      mergeMap(accessory =>
        this.equipmentApiService
          .createAccessoryEditProposal(accessory)
          .pipe(
            map(
              createdAccessoryEditProposal =>
                new CreateAccessoryEditProposalSuccess({ editProposal: createdAccessoryEditProposal })
            )
          )
      )
    )
  );

  /*********************************************************************************************************************
   * Software
   ********************************************************************************************************************/

  CreateSoftware: Observable<CreateSoftwareSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.CREATE_SOFTWARE),
      map((action: CreateSoftware) => action.payload.software),
      mergeMap(software =>
        this.equipmentApiService
          .createSoftware(software)
          .pipe(map(createdSoftware => new CreateSoftwareSuccess({ item: createdSoftware })))
      )
    )
  );

  CreateSoftwareEditProposal: Observable<CreateSoftwareEditProposalSuccess> = createEffect(() =>
    this.actions$.pipe(
      ofType(EquipmentActionTypes.CREATE_SOFTWARE_EDIT_PROPOSAL),
      map((action: CreateSoftwareEditProposal) => action.payload.software),
      mergeMap(software =>
        this.equipmentApiService
          .createSoftwareEditProposal(software)
          .pipe(
            map(
              createdSoftwareEditProposal =>
                new CreateSoftwareEditProposalSuccess({ editProposal: createdSoftwareEditProposal })
            )
          )
      )
    )
  );

  constructor(
    public readonly store$: Store<State>,
    public readonly actions$: Actions<All>,
    public readonly equipmentApiService: EquipmentApiService,
    public readonly utilsService: UtilsService
  ) {
  }
}
