// Small dialog service: promise-based confirm/alert rendered by <ConfirmModal>
// (mounted once in the root layout). Replaces the browser's native alert/confirm
// with the site's own centered modal.
type Variant = 'primary' | 'warn' | 'danger';

type DialogReq = {
	title: string;
	message: string;
	confirmLabel: string;
	cancelLabel: string | null; // null = alert (single button, no cancel)
	variant: Variant;
	resolve: (ok: boolean) => void;
};

export const dialogState = $state<{ current: DialogReq | null }>({ current: null });

export function openConfirm(opts: {
	title: string;
	message: string;
	confirmLabel?: string;
	cancelLabel?: string;
	variant?: Variant;
}): Promise<boolean> {
	return new Promise((resolve) => {
		dialogState.current = {
			title: opts.title,
			message: opts.message,
			confirmLabel: opts.confirmLabel ?? 'Aceptar',
			cancelLabel: opts.cancelLabel ?? 'Cancelar',
			variant: opts.variant ?? 'primary',
			resolve
		};
	});
}

export function openAlert(opts: {
	title: string;
	message: string;
	confirmLabel?: string;
	variant?: Variant;
}): Promise<void> {
	return new Promise((resolve) => {
		dialogState.current = {
			title: opts.title,
			message: opts.message,
			confirmLabel: opts.confirmLabel ?? 'Entendido',
			cancelLabel: null,
			variant: opts.variant ?? 'warn',
			resolve: () => resolve()
		};
	});
}

export function resolveDialog(ok: boolean) {
	const d = dialogState.current;
	dialogState.current = null;
	d?.resolve(ok);
}

// Convenience: confirm, then submit the button's owning <form> (via enhance).
// Pass the button element synchronously (before any await) so its form is captured.
export async function confirmAndSubmit(
	el: HTMLElement,
	opts: { title: string; message: string; confirmLabel?: string; cancelLabel?: string; variant?: Variant }
) {
	const form = el.closest('form');
	if (!form) return;
	const ok = await openConfirm(opts);
	if (ok) (form as HTMLFormElement).requestSubmit();
}
