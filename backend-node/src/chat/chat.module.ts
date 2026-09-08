import { Module } from '@nestjs/common';
import { FoldersModule } from '../folders/folders.module';
import { MealPlansModule } from '../meal-plans/meal-plans.module';
import { PantryItemsModule } from '../pantry-items/pantry-items.module';
import { RecipesModule } from '../recipes/recipes.module';
import { ShoppingListModule } from '../shopping-list/shopping-list.module';
import { UsageQuotaModule } from '../usage-quota/usage-quota.module';
import { UserPreferencesModule } from '../user-preferences/user-preferences.module';
import { ChatController } from './chat.controller';
import { ChatHistoryService } from './chat-history.service';
import { ChatSessionGuard } from './chat-session.guard';
import { ChatService } from './chat.service';
import { CookingToolsService } from './cooking-tools.service';
import { chatCheckpointerProvider } from './graph/chat-checkpointer.provider';
import { CookingAgentGraphService } from './graph/cooking-agent-graph.service';
import { ChatSessionsService } from './sessions/chat-sessions.service';
import { ToolResultCollectorService } from './tool-result-collector.service';

@Module({
  imports: [
    RecipesModule,
    MealPlansModule,
    PantryItemsModule,
    ShoppingListModule,
    FoldersModule,
    UserPreferencesModule,
    UsageQuotaModule,
  ],
  controllers: [ChatController],
  providers: [
    chatCheckpointerProvider,
    CookingAgentGraphService,
    ChatService,
    ChatHistoryService,
    ChatSessionsService,
    ChatSessionGuard,
    CookingToolsService,
    ToolResultCollectorService,
  ],
  exports: [ChatService],
})
export class ChatModule {}
