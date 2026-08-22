import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

export interface PetTrainedEvent {
  petId: string;
  xpAwarded: number;
}

@Injectable()
export class PetEventsService {
  private readonly trained = new Subject<PetTrainedEvent>();

  readonly trained$: Observable<PetTrainedEvent> = this.trained.asObservable();

  emitTrained(event: PetTrainedEvent): void {
    this.trained.next(event);
  }
}
