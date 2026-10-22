@if ($paginator->hasPages())
    <nav class="pager" aria-label="Pages">
        @if ($paginator->onFirstPage()) <span>Previous</span> @else <a href="{{ $paginator->previousPageUrl() }}">Previous</a> @endif
        <span class="cur">Page {{ $paginator->currentPage() }} of {{ $paginator->lastPage() }}</span>
        @if ($paginator->hasMorePages()) <a href="{{ $paginator->nextPageUrl() }}">Next</a> @else <span>Next</span> @endif
    </nav>
@endif
