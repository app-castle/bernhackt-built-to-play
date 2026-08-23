# Planning

## Features

We need to start a new project and create github issues and manage them. You can use the github MCP for that.

We want to create a game for a desktop pet. But it will be multiplayer and your pet may interact with other players pets.

First we want to create issues for all features. Lets plan these out together and then create the issues and triage them. Its a hackathon so we may not be able to finish all features. We need to categorize them and have like an MVP version and then additional features.

You may ask further clarifing questions.

Features:

- Training your pet
  -- it will be trained through keystrokes (kinda like Bongo cat)
  -- it can be sent to another player where he will be "pet-sitting" and if the pet plays with the other players pet it generates additional EXP

- Events
  -- events can occure randomly
  -- an event could have any kind of thing happening to your pet
  -- events could have positive or negative effects or rewards

- Quests
  -- you can send the pet to a quest
  -- it could get a card as reward
  -- it could get EXP as reward

- Cards
  -- can be equipment for your pet (bow, sword, armor, etc.)
  -- can be action cards (light attack, heavy attack, block, heal, etc.)
  -- the pet can have n equipment cards equipped at all time
  -- the pet can have n action cards at all time

- Buildings/Buildables (this is very low priority)
  -- you can build something for your pet (bed, stable, foodtrough, etc.)
  -- they are built using keystrokes, at this time the the pet does not receive EXP tho, so it might make sense to send the pet away

- Fighting
  -- 2 pets fight against each other in a card loop
  -- equipped action cards get played in a turn based manner, in the order they are equipped
  -- so when A plays an attack card, B might play a block card
  -- damage calculation is based on:
  --- values of action cards (eg. light or hard attack)
  --- equipped equippement cards
  --- base attack and defense level (based on earned EXP for this pet)

- Tournament mode
  -- tournaments can be organized where players battle against eachother
  -- eg. with a swiss style bracket
  -- this bracket must be visible to players to see who your next opponent is and where you are ranked

- 1v1 Fights without tournament
  -- A can challange B to a fight
  -- there could be rewards for the winner (EXP, etc.)

- Raids
  -- A could decide to raid B
  -- if B's Pet is home it can defend
  -- if B can react to the challange fast enough it gives his Pet a defense boost

- UI
  -- must be like a Desktop pet (Bongo Cat)
  -- you can click on the pet to make him do something (maybe bubble menü like in sims)
