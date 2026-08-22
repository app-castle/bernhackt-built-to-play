import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject, filter, map, merge } from 'rxjs';
import { BattleChallengeEvent } from './battle-challenge.event';
import { BattleResolvedEvent } from './battle-resolved.event';

@Injectable()
export class BattleEventsService {
  private readonly challenges = new Subject<BattleChallengeEvent>();
  private readonly resolutions = new Subject<BattleResolvedEvent>();

  emitChallenge(event: BattleChallengeEvent): void {
    this.challenges.next(event);
  }

  emitResolved(event: BattleResolvedEvent): void {
    this.resolutions.next(event);
  }

  streamFor(petId: string): Observable<MessageEvent> {
    const challenged = this.challenges.asObservable().pipe(
      filter((event) => event.defenderPetId === petId),
      map((event) => ({ type: 'battle.challenged', data: event })),
    );

    const resolved = this.resolutions.asObservable().pipe(
      filter(
        (event) =>
          event.challengerPetId === petId || event.defenderPetId === petId,
      ),
      map((event) => ({ type: 'battle.resolved', data: event })),
    );

    return merge(challenged, resolved);
  }
}
