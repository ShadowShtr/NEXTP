package com.nextp.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.nextp.app.ui.theme.NextPColors

/**
 * Componentes base do NextP Clay System.
 * Superfícies macias e elevadas (sombra suave azulada + cantos grandes).
 * Ver docs/05-design-system.md.
 */

/** Card clay: fundo claro, cantos grandes, sombra suave. */
@Composable
fun ClayCard(
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(24.dp),
    background: Color = NextPColors.CardWhite,
    elevation: Dp = 10.dp,
    contentPadding: PaddingValues = PaddingValues(16.dp),
    content: @Composable () -> Unit,
) {
    Box(
        modifier = modifier
            .shadow(elevation, shape, ambientColor = NextPColors.ShadowBlue, spotColor = NextPColors.ShadowBlue)
            .background(background, shape)
            .padding(contentPadding)
    ) { content() }
}

/**
 * Bolinha de checklist dos pagamentos recorrentes.
 * Ver docs/11-pagamentos-recorrentes.md.
 */
enum class PaymentDotState { PENDING, PAID, PARTIAL, OVERDUE, IGNORED }

@Composable
fun PaymentDot(
    state: PaymentDotState,
    modifier: Modifier = Modifier,
    size: Dp = 28.dp,
) {
    val color = when (state) {
        PaymentDotState.PENDING -> NextPColors.White
        PaymentDotState.PAID -> NextPColors.PrimaryBlue
        PaymentDotState.PARTIAL -> NextPColors.CoinYellow
        PaymentDotState.OVERDUE -> NextPColors.Danger
        PaymentDotState.IGNORED -> NextPColors.TextMuted
    }
    Box(
        modifier = modifier
            .shadow(4.dp, CircleShape, ambientColor = NextPColors.ShadowBlue, spotColor = NextPColors.ShadowBlue)
            .background(color, CircleShape)
    ) {
        if (state == PaymentDotState.PAID) {
            // check branco simples
            Text("✓", color = NextPColors.White, modifier = Modifier.padding(2.dp))
        }
    }
}
