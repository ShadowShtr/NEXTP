package com.nextp.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.nextp.app.data.local.entity.RecurringPayment
import com.nextp.app.data.local.entity.RecurringPaymentOccurrence
import kotlinx.coroutines.flow.Flow

@Dao
interface RecurringDao {
    // --- Templates ---
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPayment(p: RecurringPayment): Long

    @Update suspend fun updatePayment(p: RecurringPayment)

    @Query("SELECT * FROM recurring_payments WHERE isActive = 1 ORDER BY dueDay")
    fun observeActivePayments(): Flow<List<RecurringPayment>>

    @Query("SELECT * FROM recurring_payments")
    suspend fun getAllPayments(): List<RecurringPayment>

    // --- Ocorrências mensais (independentes por mês) ---
    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertOccurrence(o: RecurringPaymentOccurrence): Long

    @Update suspend fun updateOccurrence(o: RecurringPaymentOccurrence)

    @Query("SELECT * FROM recurring_payment_occurrences WHERE year = :year AND month = :month ORDER BY dueDate")
    fun observeOccurrences(year: Int, month: Int): Flow<List<RecurringPaymentOccurrence>>

    @Query("SELECT * FROM recurring_payment_occurrences WHERE recurringPaymentId = :paymentId AND year = :year AND month = :month LIMIT 1")
    suspend fun findOccurrence(paymentId: Long, year: Int, month: Int): RecurringPaymentOccurrence?

    @Query("SELECT COALESCE(SUM(paidAmount),0) FROM recurring_payment_occurrences WHERE year = :year AND month = :month AND status IN ('PAID','PARTIAL')")
    fun totalPaid(year: Int, month: Int): Flow<Double>

    @Query("SELECT COALESCE(SUM(expectedAmount - paidAmount),0) FROM recurring_payment_occurrences WHERE year = :year AND month = :month AND status IN ('PENDING','PARTIAL','OVERDUE')")
    fun totalPending(year: Int, month: Int): Flow<Double>

    @Query("SELECT * FROM recurring_payment_occurrences")
    suspend fun getAllOccurrences(): List<RecurringPaymentOccurrence>
}
