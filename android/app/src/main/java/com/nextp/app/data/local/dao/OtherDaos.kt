package com.nextp.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.nextp.app.data.local.entity.Category
import com.nextp.app.data.local.entity.MonthlySummary
import com.nextp.app.data.local.entity.PlanningItem
import com.nextp.app.data.local.entity.SavedItem
import com.nextp.app.data.local.entity.UserSettings
import kotlinx.coroutines.flow.Flow

@Dao
interface CategoryDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insert(c: Category): Long
    @Insert(onConflict = OnConflictStrategy.IGNORE) suspend fun insertAll(items: List<Category>)
    @Update suspend fun update(c: Category)
    @Query("SELECT * FROM categories ORDER BY id") fun observeAll(): Flow<List<Category>>
    @Query("SELECT COUNT(*) FROM categories") suspend fun count(): Int
    @Query("SELECT * FROM categories") suspend fun getAll(): List<Category>
}

@Dao
interface SavedItemDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insert(item: SavedItem): Long
    @Update suspend fun update(item: SavedItem)
    @Query("SELECT * FROM saved_items ORDER BY purchaseDate DESC") fun observeAll(): Flow<List<SavedItem>>
    @Query("SELECT COALESCE(SUM(amount),0) FROM saved_items") fun totalValue(): Flow<Double>
    @Query("SELECT * FROM saved_items") suspend fun getAll(): List<SavedItem>
}

@Dao
interface PlanningDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun insert(item: PlanningItem): Long
    @Update suspend fun update(item: PlanningItem)
    @Query("SELECT * FROM planning_items ORDER BY dueDate") fun observeAll(): Flow<List<PlanningItem>>
    @Query("SELECT * FROM planning_items") suspend fun getAll(): List<PlanningItem>
}

@Dao
interface MonthlySummaryDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun upsert(s: MonthlySummary): Long
    @Query("SELECT * FROM monthly_summaries WHERE year = :year AND month = :month LIMIT 1")
    suspend fun find(year: Int, month: Int): MonthlySummary?
    @Query("SELECT * FROM monthly_summaries") suspend fun getAll(): List<MonthlySummary>
}

@Dao
interface UserSettingsDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE) suspend fun upsert(s: UserSettings)
    @Query("SELECT * FROM user_settings WHERE id = 1 LIMIT 1") fun observe(): Flow<UserSettings?>
    @Query("SELECT * FROM user_settings WHERE id = 1 LIMIT 1") suspend fun get(): UserSettings?
}
