package com.nextp.app.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.nextp.app.data.local.entity.Expense
import kotlinx.coroutines.flow.Flow

@Dao
interface ExpenseDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(expense: Expense): Long

    @Update suspend fun update(expense: Expense)
    @Delete suspend fun delete(expense: Expense)

    @Query("SELECT * FROM expenses WHERE date = :date ORDER BY time DESC")
    fun observeByDate(date: String): Flow<List<Expense>>

    @Query("SELECT * FROM expenses WHERE date BETWEEN :start AND :end ORDER BY date DESC, time DESC")
    fun observeBetween(start: String, end: String): Flow<List<Expense>>

    @Query("SELECT COALESCE(SUM(amount),0) FROM expenses WHERE date = :date")
    fun totalForDay(date: String): Flow<Double>

    @Query("SELECT COALESCE(SUM(amount),0) FROM expenses WHERE date BETWEEN :start AND :end")
    fun totalBetween(start: String, end: String): Flow<Double>

    /** Gastos Invisíveis: soma dos gastos pequenos abaixo do limite no intervalo. */
    @Query("SELECT COALESCE(SUM(amount),0) FROM expenses WHERE date BETWEEN :start AND :end AND amount < :limit")
    fun smallExpensesTotal(start: String, end: String, limit: Double): Flow<Double>

    @Query("SELECT description FROM expenses GROUP BY description ORDER BY COUNT(*) DESC LIMIT :max")
    suspend fun recentDescriptions(max: Int): List<String>

    @Query("SELECT * FROM expenses")
    suspend fun getAll(): List<Expense>
}
