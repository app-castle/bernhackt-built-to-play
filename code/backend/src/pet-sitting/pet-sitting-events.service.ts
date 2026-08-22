import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject, filter, map, merge } from 'rxjs';
import { PetSittingEndedEvent } from './pet-sitting-ended.event';
import { PetSittingInvitedEvent } from './pet-sitting-invited.event';
import { PetSittingStartedEvent } from './pet-sitting-started.event';

@Injectable()
export class PetSittingEventsService {
  private readonly invitations = new Subject<PetSittingInvitedEvent>();
  private readonly starts = new Subject<PetSittingStartedEvent>();
  private readonly ends = new Subject<PetSittingEndedEvent>();

  emitInvited(event: PetSittingInvitedEvent): void {
    this.invitations.next(event);
  }

  emitStarted(event: PetSittingStartedEvent): void {
    this.starts.next(event);
  }

  emitEnded(event: PetSittingEndedEvent): void {
    this.ends.next(event);
  }

  streamFor(petId: string): Observable<MessageEvent> {
    const invited = this.invitations.asObservable().pipe(
      filter((event) => event.hostPetId === petId),
      map((event) => ({ type: 'pet-sitting.invited', data: event })),
    );

    const started = this.starts.asObservable().pipe(
      filter(
        (event) => event.senderPetId === petId || event.hostPetId === petId,
      ),
      map((event) => ({ type: 'pet-sitting.started', data: event })),
    );

    const ended = this.ends.asObservable().pipe(
      filter(
        (event) => event.senderPetId === petId || event.hostPetId === petId,
      ),
      map((event) => ({ type: 'pet-sitting.ended', data: event })),
    );

    return merge(invited, started, ended);
  }
}
