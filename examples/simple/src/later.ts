import { Event, Handler, HandlerStrategy, Handles, Message, StartedBy } from '@ddk/core';
import { Field, InputType } from '@ddk/graphql';
import { StatefulProcess } from '@ddk/core/src/StatefulProcess';

class RecipeAddedEvent extends Event {
  constructor() {
    super();
  }

  getType(): string {
    return 'RecipeAdded';
  }
}

class RecipeDeletedEvent extends Event {
  constructor() {
    super();
  }

  getType(): string {
    return 'RecipeDeleted';
  }
}

@StartedBy(RecipeAddedEvent) // or array of events @StartedBy([RecipeAddedEvent, RecipeDeletedEvent])
@Handles(RecipeDeletedEvent) // or array of events @Handles([RecipeAddedEvent])
class MyProcess extends StatefulProcess {
  handle(message: Message) {
    if (message) return StatefulProcess.CONTINUE;
    return StatefulProcess.TERMINATE;
  }
}

@InputType()
@Handler<StatefulProcess>(MyProcess, { strategy: HandlerStrategy.CREATE })
export class RunTaskCommand {
  @Field(() => String)
  public readonly title: string;

  constructor(title: string) {
    this.title = title;
  }
}
