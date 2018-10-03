import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

angular.module('Module.exchange').directive('exchangeEditor', () => ({
  scope: {
    ngModel: '=',
  },
  link(scope, element) {
    ClassicEditor.create(element[0]).then((editor) => {
      editor.model.document.on('change:data', () => {
        scope.ngModel = editor.getData();
      });

      scope.$watch('ngModel', () => {
        editor.setData(scope.ngModel);
      });
    });
  },
}));
