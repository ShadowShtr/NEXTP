package com.nextp.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.nextp.app.data.local.dao.CategoryDao
import com.nextp.app.data.local.dao.ExpenseDao
import com.nextp.app.data.local.dao.MonthlySummaryDao
import com.nextp.app.data.local.dao.PlanningDao
import com.nextp.app.data.local.dao.RecurringDao
import com.nextp.app.data.local.dao.SavedItemDao
import com.nextp.app.data.local.dao.UserSettingsDao
import com.nextp.app.data.local.entity.Category
import com.nextp.app.data.local.entity.Expense
import com.nextp.app.data.local.entity.MonthlySummary
import com.nextp.app.data.local.entity.PlanningItem
import com.nextp.app.data.local.entity.RecurringPayment
import com.nextp.app.data.local.entity.RecurringPaymentOccurrence
import com.nextp.app.data.local.entity.SavedItem
import com.nextp.app.data.local.entity.UserSettings

@Database(
    entities = [
        Category::class,
        Expense::class,
        SavedItem::class,
        PlanningItem::class,
        RecurringPayment::class,
        RecurringPaymentOccurrence::class,
        MonthlySummary::class,
        UserSettings::class,
    ],
    version = 1,
    exportSchema = true,
)
@TypeConverters(Converters::class)
abstract class NextPDatabase : RoomDatabase() {
    abstract fun expenseDao(): ExpenseDao
    abstract fun categoryDao(): CategoryDao
    abstract fun savedItemDao(): SavedItemDao
    abstract fun planningDao(): PlanningDao
    abstract fun recurringDao(): RecurringDao
    abstract fun monthlySummaryDao(): MonthlySummaryDao
    abstract fun userSettingsDao(): UserSettingsDao

    companion object {
        @Volatile private var INSTANCE: NextPDatabase? = null

        fun get(context: Context): NextPDatabase =
            INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    NextPDatabase::class.java,
                    "nextp.db"
                )
                    // Persistência real em disco. Migrations reais serão adicionadas
                    // a cada mudança de schema (ver docs/04-banco-de-dados.md).
                    .build()
                    .also { INSTANCE = it }
            }
    }
}
