/**
 * Created with JetBrains PhpStorm.
 * User: yuuu
 * Date: 13/11/15
 * Time: 18:10
 * To change this template use File | Settings | File Templates.
 */

(function ($) {
    
    /**
     * set sample data
     */
    $('#e2d3-index-sample').on('click',function(){
        //ゴニョゴニョ
        location.href = 'sample.html';
    });
    
    /**
    * tooltip
    */
    $(document).ready(function () {
        $('.e2d3-tooltip').tooltip();
    });
    /**
    * Hide only chart
    */
    $(document).on('click', '.hide-only-chart', function () {
        console.log(this);
        $('.hide-only-chart-area').css('display', 'none');
        
        var btn = $('<button>').addClass('btn btn-default btn-xs navbar-btn e2d3-tooltip e2d3-dropdown').attr('data-dropdown','dropdown').attr('data-placement','bottom').attr('title','View default');
        $(btn).append($('<i>').addClass('fa fa-cog fa-lg'));
        var ul = $('<ul>').addClass('dropdown-menu');
        var a1 = $('<a>').addClass('a-pointer view-only-chart');
        $(a1).append($('<i>').addClass('fa fa-bar-chart'));
        $(a1).append('View default');
        $(ul).append($('<li>').append(a1));
        var box = $('<div>').addClass('dropdown view-only-chart-box pull-right');
        $(box).append(btn); $(box).append(ul);
        $('body').append(box);
        $(btn).dropdown();
    });
    $(document).on('click', '.view-only-chart', function () {
        $('.hide-only-chart-area').css('display', '');
        $('.view-only-chart-box').remove();
    });
    /**
     * Check All
     */
    $(document).on("click",".checkbox_all",function(){
        var table = $(this).closest("table");
        if($(this).prop("checked")){
            $(table).find(".checkbox_all_target").prop("checked",true);
        }else{
            $(table).find(".checkbox_all_target").prop("checked",false);
        }
    });
})(jQuery);

function createTargetSelector(targets, options) {
    var box = $("<div>").attr("id","e2d3-target-selector-box");
    var group;
    if (!targets) {
        return;
    }
    switch (options.type) {
        case "dropdown":
            group = $("<select>").attr("id", "e2d3-target-selector");
            targets.forEach(function (d) {
                var t = $("<option>").html(d).val(d);
                $(group).append(t);
            });
            if (options.value) $(group).val(options.value);
            break;
        case "vertical":
            group = $("<div>").addClass("btn-group-vertical");
            targets.forEach(function (d) {
                var l = $("<label>").addClass("btn btn-default");
                var t = $("<input>").attr({ type: "radio" }).val(d);
                if (options.value && d === options.value) $(t).prop("checked", true);
                $(l).append(t);
                $(group).append(l);
            });
            break;
        case "slider":

            break;
        default:
    }
    $(box).append(group);
    if (targets.length === 1) $(box).hide();
    $("#e2d3-chart-area").prepend(box);

}
