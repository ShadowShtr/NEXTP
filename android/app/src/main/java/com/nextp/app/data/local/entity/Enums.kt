package com.nextp.app.data.local.entity

/** Origem de um gasto. */
enum class ExpenseSource { MANUAL, RECURRING, SAVED_ITEM }

/** Tipo de item de planeamento. */
enum class PlanningType { FUTURE_BILL, DEBT, WISH, INSTALLMENT, GOAL, RECURRING }

/** Estado geral (planeamento e ocorrências recorrentes). */
enum class PaymentStatus { PENDING, PAID, PARTIAL, CANCELLED, OVERDUE, IGNORED }

/** Prioridade de planeamento. */
enum class Priority { LOW, MEDIUM, HIGH, URGENT }

/** Repetição de contas/planeamentos. */
enum class RepeatType { NONE, MONTHLY, WEEKLY, YEARLY }

/** Comportamento de lançar recorrente como gasto. */
enum class AutoExpenseMode { ASK, ALWAYS, NEVER }
